# Tareas pendientes — Sakai NG

> **Última actualización: 2026-11-02** · Rama `feat/core-foundation`
> Estado de referencia: Fase 2.5 completa · Fase 3 adelantada · **Nomencladores/Países cerrado** · gates ✅ 2026-11-02 (lint 0 · 429/429 · build OK).
> Estados: `[ ]` pendiente · `[~]` en curso · `[x]` hecho · `[!]` bloqueado. Prioridad: **P0** bloqueante, **P1** alta, **P2** media, **P3** baja.

---

## 1. Bloqueantes antes de commitear (P0)

| ID | Tarea | Estado | Criterio de aceptación |
|---|---|---|---|
| GIT-001 | Re-stagear todo con paths explícitos | [x] | `git reset` + `git add -A -- <paths>` por lote; `git status` limpio el 2026-11-02 |
| GIT-002 | Decidir `src/assets/config.development.json` | [x] | En desarrollo apunta a `http://172.22.10.2:1235`; se versiona tal cual (decisión 2026-11-02) |
| GIT-003 | Sacar del índice los logs trackeados | [ ] | `l4.log`, `ngtest-err.log`, `ngtest.log`, `test3.log`, `test5.log` fuera de git (siguen trackeados) |
| GIT-004 | Decidir lockfile | [ ] | Solo uno de `package-lock.json` / `pnpm-lock.yaml` versionado (hoy conviven los dos) |
| GIT-005 | Commits por unidad lógica | [x] | 14 commits por área el 2026-11-02 (build, config, core x2, shared, layout, auth, security x2, nomenclators, certification, routes, test-setup, docs) |
| GIT-006 | Push de los commits locales | [x] | `origin/feat/core-foundation` al día: `68e8c6d..ead8b38` (29 commits) |
| DOC-012 | Revisar y commitear la base documental | [x] | Base documental commiteada en `ead8b38` (AGENTS, ESTADO, docs/*) |

## 2. Nomencladores/Países (P1)

| ID | Tarea | Estado | Criterio de aceptación |
|---|---|---|---|
| NOM-001 | Decidir alcance: CRUD completo o solo listado + detalle | [x] | ADR-012 en `docs/DECISIONES.md`: sin borrado físico; baja = desactivación |
| NOM-002 | Implementar diálogo add/edit | [x] | `CountryDialog` con validación §8 y `{ name, code }` |
| NOM-003 | Arreglar o eliminar `CountryDetails` | [x] | Eliminado; reemplazado por `CountryDetailDialog` |
| NOM-004 | Conectar detalle real | [x] | `rxResource` + skeleton + error con reintento |
| NOM-005 | Decidir e implementar "Activo" | [x] | Toggle one-way con `activate`/`deactivate` por `id`; no optimista y con `withPendingKeys` |
| NOM-006 | Corregir permisos del toolbar y acciones | [x] | Alta `Create`; detalle `Read`; edición/toggle `Update` |
| NOM-007 | Corregir textos y copy | [x] | "Código", "países", empty state; sin "countrys" ni "Nuevo Rol" |
| NOM-008 | Tests con valor para store/página/tabla | [x] | Specs de tabla, página, diálogos, repo, store, `withPendingKeys`, menú y rutas |
| NOM-009 | Normalizar ruta a `paises` (ASCII) | [x] | `/nomencladores/paises` + redirect desde `países` |
| NOM-010 | Corregir wildcard de nomencladores | [x] | Redirige a `/notfound` con `pathMatch: 'full'` |

## 3. Menú, rutas y RBAC (P1)

| ID | Tarea | Estado | Criterio de aceptación |
|---|---|---|---|
| SEC-001 | Quitar "Países" duplicado del menú | [x] | Una sola entrada, bajo Configuración > Nomencladores |
| SEC-002 | Resolver duplicidad de "Configuración" | [x] | Hoja de Seguridad renombrada "Parámetros del sistema" |
| SEC-003 | Consolidar rutas `seguridad` en `security.routes.ts` | [ ] | Una sola entrada `seguridad` con children; sin stub vacío |
| SEC-004 | Test de navegación de las rutas de seguridad | [ ] | Cubre roles, usuarios, auditorías y configuración |
| SEC-005 | Verificar recurso `Nomenclators` en backend | [ ] | Si no existe, ajustar `RESOURCES`/contrato en `CONTRATOS-BACKEND` |
| SEC-006 | Revisar permiso de Configuración (`Update` vs `Read`) | [ ] | Coherente con menú y guard; documentado |

## 4. Verificación contra backend (P1)

| ID | Tarea | Estado | Criterio de aceptación |
|---|---|---|---|
| BE-001 | `GET /api/v1/audits/actions-types` | [ ] | Shape confirmado (`{id,name}` vs `description`); ajustar `optionLabel` si aplica |
| BE-002 | Auditorías end-to-end | [ ] | Listado, buscador, 6 filtros, persistencia 24 h, detalle con retry, paginación |
| BE-003 | Usuarios end-to-end | [ ] | Create/update con password opcional, reset password, detalle |
| BE-004 | Países end-to-end | [ ] | Listado, `getById`, create/update `{ name, code }`, `activate/{id}` y `DELETE /{id}` según contrato real |
| BE-005 | Logout/refresh casing | [ ] | `{ refreshToken }` vs `{ RefreshToken }` confirmado y documentado |
| BE-006 | Identity/permisos | [ ] | `user/current` y permisos aplanados verificados con backend real |

## 5. Deuda técnica y limpieza (P2)

| ID | Tarea | Estado | Criterio de aceptación |
|---|---|---|---|
| TECH-001 | `AuditMapper` inconsistente (`moment: string` vs `Date`) | [ ] | Tipo corregido y mapper usado o eliminado |
| TECH-002 | `security.routes.ts` vacío | [ ] | Implementado o eliminado |
| TECH-003 | `ConfirmActionService` sin uso | [ ] | Adoptado en pantallas CRUD o eliminado |
| TECH-004 | `hasActiveFilters` duplicado (`withQuery`/`withFilters`) | [ ] | Una sola definición; sin warning de NgRx |
| TECH-005 | `withServerTable` no resetea `meta` en error | [ ] | Estado de error consistente (meta vacía) |
| TECH-006 | `RoleFiltersComponent` prototipo comentado | [ ] | Evolucionado con `filter-*` o eliminado |
| TECH-007 | `FilterFormComponentComponent` roto y sin uso | [ ] | Arreglado o eliminado |
| TECH-008 | `PageChangeEvent` duplicado en tablas | [ ] | Todas usan `core/interfaces/page-change-event.ts` |
| TECH-009 | Budget de bundle (~1.08 MB) | [ ] | Warning revisado; sin crecimiento injustificado |
| TECH-010 | `Alert`/hex fijos en login/topbar/panel | [ ] | Colores derivados de `--primary-color`; sin hex nuevos |
| TECH-011 | `loginSuccess`/`loginFailed`/`errorMessage` muertos | [ ] | Animaciones conectadas o código eliminado |
| TECH-012 | `styleUrl` vs `styleUrls` en panel | [ ] | Usar `styleUrl` (Angular 21) |
| TECH-013 | `MunicipalityDetailDialog` usa el skeleton de países | [ ] | Unificar `*-details-skeleton` (hoy tres clases con el mismo selector `app-country-details-skeleton`) |
| BUG-001 | Diálogos de provincia/municipio envían `{ name, code }` y el repositorio espera `{ code, descShort, descLong }` | [ ] | Contrato verificado con backend y payload corregido (o interfaz ajustada) |
| CERT-001 | `certification/requests` no está enrutado y la carpeta se llama `request-details.page.ts/` con `request-details.page.ts.ts` | [ ] | Renombrar, montar ruta y escribir specs reales antes de reactivar el módulo |

## 5.1. Testing: cobertura pendiente (2026-11-02)

| ID | Tarea | Estado | Criterio de aceptación |
|---|---|---|---|
| TEST-001 | Specs de hooks `core/hooks/*` | [ ] | `use-pagination`, `use-lazy-load`, `use-selected-item`, `use-toggle-pending`, `use-table-menu`, `use-empty-search-description` con caso feliz y borde |
| TEST-002 | Specs de stores de pantalla restantes | [ ] | `role-list.store`, `user-list.store`, `audit-list.store`, `province-list.store`, `municipality-list.store` |
| TEST-003 | Specs de componentes con lógica restantes | [ ] | `role-table`, `user-table`, `audit.page`, `filter-select`, `filter-datepicker`, `action-toolbar`, `permissions-tree`, `async-select` |
| TEST-004 | Specs de layout restantes | [ ] | `app.sidebar` (outside click) y `app.layout` |
| TEST-005 | Resto de servicios/componentes sin spec | [ ] | `rehydrate-identity`, `identity-hydrator`, `fingerprint.service`, módulo `change-password`, `user-profile`, `search`, `empty-state`, `base-table`, `quick-access` |

## 6. Fases siguientes (P2)

| ID | Tarea | Estado | Criterio de aceptación |
|---|---|---|---|
| F3-001 | Shared UI extra si se repite el patrón tabla/toolbar/filtros | [ ] | Componente reutilizable con tests |
| F3-002 | Catálogos con `httpResource` | [ ] | Roles en user-dialog y action-types en audit-filters migrados |
| F4-001 | Pantalla piloto end-to-end | [ ] | Ciclo completo con backend real, gates verdes y docs actualizadas |
| F4-002 | PR de `feat/core-foundation` → `main` | [ ] | Solo al cerrar Fase 4, con CI/gates verdes |

## 7. Hecho recientemente

- **2026-11-02 · Commit y push:** 14 commits por unidad lógica (`c74e28b..ead8b38`) y push a `origin/feat/core-foundation` (`68e8c6d..ead8b38`, 29 commits). Árbol limpio; gates verdes antes de subir.
- **2026-11-02 · Suite reparada y ampliada:** 429/429 en 79 archivos, lint 0 y build OK. Se alinearon 12 specs con los contratos actuales (`code` como identidad en países/provincias/municipios, `selectId` explícito, dominio `descShort/descLong`, `pendingCode`, `PageChangeEvent`), se eliminaron dos `should create` huérfanos de certification, se añadió `src/test-setup.ts` (polyfill de storage) y specs nuevos para features de store, helpers, menú y repositorios de usuarios/roles/nomencladores. También se corrigieron copies: toggler del menú ligado a `isExpanded()`, "Detalle del país" → provincia/municipio, `municipios` en el empty state, mensajes de éxito de provincia, ids `province-*`/`municipality-*` y mensaje de error del store de municipios.
- Fase 2.5 completa: roles, usuarios, auditorías y configuración (último verde: 2026-10-07, 227/227; superado el 2026-11-02 con 429/429).
- `withServerTable` + `withServerTableWrites` construidos y migrados.
- Restauración de sesión fail-open; `ConfigService` single-flight; `SessionReadyService` espera config.
- Base documental creada el 2026-10-23.

## 8. Recordatorios

- Angular **21** fijado; no subir a 22 (licencia PrimeUI).
- Validación: `docs/estandar-validacion-formularios.md` (§8).
- `rxResource.value()` **lanza** en error: leer `error()` primero.
- Specs de guards necesitan stub de `ConfigService`.
- Efectos en tests zoneless: `TestBed.flushEffects()`.
- Devueltos es referencia de dominio, no código a copiar.
