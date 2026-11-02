# Contratos de backend — Sakai NG

> **Última actualización: 2026-10-23.**
> Fuente de verdad de los endpoints que consume la app. Si un contrato no está marcado como **verificado**, no se asume: se prueba contra el backend real y se actualiza aquí.

**Leyenda:** ✅ funcionó contra el backend en la última corrida conocida (2026-10-07/09; re-verificar si el backend cambia) · ⚠️ pendiente de verificar · ❓ supuesto/documentado solo en la referencia.

---

## 1. Convenciones generales

| Tema | Contrato |
|---|---|
| Base URL | `serverApi` de `src/assets/config.{env}.json`; dev actual `http://127.0.0.1:1235` |
| Auth | `Authorization: Bearer <accessToken>` salvo login/refresh/logout |
| Identidad | Siempre desde `GET /api/auth/user/current`; nunca del JWT |
| Paginación (request) | `Pag.Page`, `Pag.PageSize`, `Search.SearchText`, `Search.Strict`, `Sort[i].SortBy`, `Sort[i].Ascending`, `Filter` (JSON) |
| Paginación (response) | `{ objects: T[], meta: { currentPage, nextPage, prevPage, totalPage, totalCount } }` |
| Default de página | `PageSize = 5` (`defaultQuery()`) |
| Casing | .NET bindea case-insensitive, pero el wire documentado se respeta |
| Vidas de token | `expiresIn` y `refreshTokenExpiresIn` en **minutos** |
| Fechas | ISO 8601 en tránsito; `Date`/`'YYYY-MM-DD'` en filtros según endpoint |

## 2. Auth

| Método | Endpoint | Request | Response | Estado |
|---|---|---|---|---|
| POST | `/api/auth/login` | `{ username, password, fingerprint }` | `{ accessToken, tokenType, issuedAt, refreshToken, expiresIn, refreshTokenExpiresIn }` | ✅ (contrato usado y verificado) |
| GET | `/api/auth/user/current` | — | `{ id, username, fullName, roles: [{ name, permissions: [{ resource, actions[] }] }] }` | ✅ |
| POST | `/api/auth/refresh-token` | `{ RefreshToken }` (PascalCase) | `{ accessToken, tokenType, expiresIn }` (minutos) | ⚠️ casing a confirmar en la corrida final |
| POST | `/api/auth/logout` | `{ refreshToken }` (camelCase) | `void` | ⚠️ best-effort; cuerpo cubierto por spec, falta corrida real |

**Notas**

- `fingerprint` es persistente (UUID generado una vez y guardado en `localStorage`); solo viaja en el login. Un UUID nuevo por intento dispara la regla de sesión única del backend.
- El refresh **no rota** el refresh token; solo actualiza el access token.
- Login/refresh/logout van **sin** Bearer; `user/current` **sí** lo lleva. Las exclusiones son endpoint-específicas, no por prefijo de controller.
- Errores de login: `ProblemDetails` con `detail`; la UI muestra el `detail` o un mensaje genérico.
- 401/418 en `user/current` limpian la sesión; errores transitorios (red/5xx) la conservan.

## 3. Usuarios

| Método | Endpoint | Request | Response | Estado |
|---|---|---|---|---|
| GET | `/api/users` | `QueryParams` | `PaginatedResponse<User>` | ⚠️ |
| GET | `/api/users/{id}` | — | `User` | ⚠️ |
| POST | `/api/users` | `UserCreateDto` | `User` | ⚠️ |
| PUT | `/api/users/{id}` | `UserUpdateDto` | `User` | ⚠️ |
| DELETE | `/api/users/{id}` | — | `void` | ⚠️ |
| POST | `/api/users/{id}/reset-password` | `null` | `void` (el backend devuelve clave temporal) | ⚠️ |

```ts
User { id: number; username: string; fullName: string; isUnEditable: boolean; isUnDeletable: boolean; roles: Role[]; password?: string }

UserCreateDto { userName: string; fullName: string; password?: string; passwordConfirmation?: string; roleIds: number[] }

UserUpdateDto { fullName: string; password?: string | null; passwordConfirmation?: string | null; roleIds: number[] }
```

**Notas**

- En el alta el campo es `userName` (N mayúscula, como el record .NET); el update **no** lleva username.
- Password es opcional en edición; si viene, debe coincidir con `passwordConfirmation`.
- Reset password usa el permiso `Update` sobre `User` (no existe acción `ResetPassword` en el RBAC de Sakai).
- Las reglas de password se derivan de `SettingsStore.current().passwordSettings`.

## 4. Roles

| Método | Endpoint | Request | Response | Estado |
|---|---|---|---|---|
| GET | `/api/roles` | `QueryParams` | `PaginatedResponse<Role>` | ✅ |
| GET | `/api/roles/{id}` | — | `Role` | ✅ |
| GET | `/api/roles/permissions` | — | `AppPermissionsCategory[]` | ✅ |
| GET | `/api/roles/{roleId}/permissions` | — | `AppPermissionsCategory[]` | ✅ |
| POST | `/api/roles` | `{ name }` | `Role` | ✅ |
| PUT | `/api/roles/{id}` | `{ name }` | `Role` | ✅ |
| PUT | `/api/roles/{roleId}/permissions` | `{ resource, actionType }[]` | `void` | ✅ |
| DELETE | `/api/roles/{id}` | — | `void` | ✅ |

```ts
Role { id: number; name: string; isUnEditable: boolean; isUnDeletable: boolean; permissions: PermissionDto[] }
PermissionDto { resource: string; description: string; actions: string[] }
AppPermissionsCategory { category: string; permissions: PermissionDto[] }
```

**Notas**

- Roles/usuarios no editables/eliminables se reflejan en la UI (`isUnEditable`/`isUnDeletable`).
- El catálogo de permisos se usa para el árbol de permisos por rol.

## 5. Auditorías

| Método | Endpoint | Request | Response | Estado |
|---|---|---|---|---|
| GET | `/api/v1/audits` | `QueryParams` + filtros | `PaginatedResponse<Audit>` | ⚠️ |
| GET | `/api/v1/audits/{id}` | — | `Audit` | ⚠️ |
| GET | `/api/v1/audits/actions-types` | — | `ActionType[]` | ⚠️ |

```ts
Audit { id: string; userName: string; userFullName: string; userHostAddress: string; moment: string; actionDescription: string; message: string }
ActionType { id: number; name: string }
```

**Filtros:** `UserName`, `UserFullName`, `UserHostAddress`, `Action` (número), `InitDate` (`YYYY-MM-DD`), `EndDate` (`YYYY-MM-DD`).

**Pendientes**

- Confirmar shape de `/actions-types`: nuestro dominio espera `{ id, name }`; la referencia (Devueltos) usa `optionLabel="description"` en su template, lo que contradice su propia interfaz. Si el API trae `description`, cambiar una línea en `audit-filters.component.ts`.
- Confirmar que el buscador (`Search.SearchText`) está soportado por el endpoint.
- Verificar persistencia de filtros 24 h, retry del detalle y paginación.

## 6. Configuración de seguridad

| Método | Endpoint | Request | Response | Estado |
|---|---|---|---|---|
| GET | `/api/app-settings` | — | `SecuritySettings` | ✅ |
| POST | `/api/app-settings` | `SecuritySettings` | `SecuritySettings` | ✅ |

```ts
SecuritySettings {
  accessTokenExpireMinute: number;
  sessionExpireMinute: number;
  passwordSettings: {
    validDays: number; historyMinCount: number; passwordDefaultValue: string;
    minLength: number; requiresUppercase: boolean; requiresLowercase: boolean;
    requiresDigits: boolean; requiresSpecialChars: boolean;
  };
  lockOutSettings: { maxAttempts: number; lockOutTimeMinutes: number };
  userSettings: { usernameMinLength: number };
}
```

**Notas**

- El endpoint se guarda con **POST** (no PUT) según la referencia; el repositorio encapsula el verbo para cambiarlo en un solo sitio.
- Las reglas de negocio (`SETTINGS_RULES`) viven en el dominio y alimentan los validadores.

## 7. Países (Nomencladores)

| Método | Endpoint | Request | Response | Estado |
|---|---|---|---|---|
| GET | `/api/country/all` | `QueryParams` | `PaginatedResponse<Country>` | ⚠️ |
| GET | `/api/country/{id}` | — | `Country` | ❓ contrato de la referencia |
| POST | `/api/country` | `{ name, code }` | `Country` | ❓ contrato de la referencia |
| PUT | `/api/country/{id}` | `{ name, code }` | `Country` | ❓ contrato de la referencia |
| PUT | `/api/country/activate/{id}` | `{}` (JSON vacío) | `void` | ❓ **supuesto** (BE-004) |
| DELETE | `/api/country/{id}` | `{}` (JSON vacío) | `void` | ❓ **supuesto** (BE-004) |

```ts
Country { id: number; name: string; code: string; active: boolean }
CountryPayload { name: string; code: string }
```

**Notas**

- No hay eliminación física: `DELETE /api/country/{id}` **desactiva**. La baja de un país es su desactivación (ADR-012).
- Todas las operaciones usan `id`: create/update, detalle (`GET /{id}`), activación y desactivación.
- El toggle **no es optimista**: la entidad se actualiza cuando el backend responde; un segundo toggle del mismo `id` se ignora mientras el primero está en vuelo. `requestResponse` envía `{}` para forzar `Content-Type: application/json`.
- Permisos: alta `Create`, edición y toggle `Update`, detalle `Read`, recurso `Nomenclators`.

**Pendientes**

- Confirmar el endpoint real del listado (`/api/country/all` es el usado hoy) y el shape de `code`/`active`.
- Verificar en backend que `PUT /api/country/activate/{id}` y `DELETE /api/country/{id}` (ambos con `{}`) sean la activación/desactivación.
- Confirmar el recurso RBAC `Nomenclators` (si el backend usa otro nombre, ajustar `RESOURCES`).
- Confirmar si `create`/`update` aceptan `active` además de `name` y `code`.

### 7.1 Provincias y municipios

| Método | Endpoint | Request | Response | Estado |
|---|---|---|---|---|
| GET | `/api/province/all`, `/api/municipality/all` | `QueryParams` | `PaginatedResponse<Province \| Municipality>` | ❓ por verificar |
| GET | `/api/province/{code}`, `/api/municipality/{code}` | - | `{ code, descShort, descLong, active }` | ❓ por verificar |
| POST | `/api/province`, `/api/municipality` | `{ code, descShort, descLong }` | entidad creada | ❓ por verificar |
| PUT | `/api/province/{code}`, `/api/municipality/{code}` | `{ code, descShort, descLong }` | entidad actualizada | ❓ por verificar |
| PUT | `/api/{province\|municipality}/activate/{code}` | `{}` | `void` | ❓ por verificar |
| DELETE | `/api/province/{code}`, `/api/municipality/{code}` | `{}` | `void` | ❓ por verificar |

- La identidad de estas entidades es `code` (no hay `id`); los formularios capturan Código, Acrónimo (`descShort`) y Nombre (`descLong`).
- Permisos: `Nomenclators` con `Create`/`Read`/`Update`, igual que países.
- **Pendiente (BE-004):** confirmar que el backend espera `descShort`/`descLong` en el alta y edición.

### 7.2 Configuración

- Recurso RBAC `SecConfig` con acción **`Update`** (no `Read`) en menú, ruta y guard; con `Read` el ítem quedaba oculto.

## 8. Errores y estados

- `ProblemDetails` (4xx/5xx): usar `detail` o `message`; el detalle técnico solo en consola.
- 401 en endpoint autenticado: el interceptor intenta refresh single-flight; si falla, limpia sesión y redirige a login.
- 418: se trata como sesión inválida (limpieza).
- 403: sin permiso; redirige a la página de acceso denegado.
- Red/5xx en restauración de sesión: **no** limpiar tokens (fail-open).

## 9. Pendientes de verificación (checklist)

- [ ] `GET /api/v1/audits/actions-types` → shape `{id,name}` vs `description`.
- [ ] Auditorías end-to-end (listado, buscador, 6 filtros, persistencia, detalle, paginación).
- [ ] Usuarios end-to-end (create/update con password opcional, reset, detalle).
- [ ] Países end-to-end (`/api/country/all`, `getById`, create/update con `{ name, code }`, `activate/{id}` y `DELETE /{id}`).
- [ ] Casing de logout (`refreshToken`) y refresh (`RefreshToken`).
- [ ] Recurso RBAC `Nomenclators` y permisos de Configuración (`Update` vs `Read`).
