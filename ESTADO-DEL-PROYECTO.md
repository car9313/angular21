# Estado del Proyecto — Sakai NG (Angular 21)

> Documento de continuidad. Fecha: 2026-09-21 · Rama: `feat/core-foundation`
> Cualquier máquina: `git pull` + `pnpm install` (el lockfile está versionado) y correr los gates del final.

---

## 1. Objetivo

Construir una aplicación **Angular premium, escalable y mantenible** que reutilice el **mismo cascarón de seguridad y layout** de la app "Devueltos" (referencia: `D:\Trabajo\Proyectos\TFS\DEVUELTO\devueltos_ui`), pero **reconstruido con mejores prácticas modernas**.

**Regla de oro: devueltos es REFERENCIA, no código a copiar.** De él se extrae conocimiento de dominio (contrato de paginación .NET, modelo RBAC, flujo de auth, logout `POST /api/auth/logout` con `{ refreshToken }`, edge cases); su deuda NO se porta (crypto-js, `any` a granel, widgets demo, código muerto, BehaviorSubject duales). Ruta local de la referencia: `C:\Users\Admin\Documents\claudia\devueltos` (en la otra PC: `D:\Trabajo\Proyectos\TFS\DEVUELTO\devueltos_ui`).

## 2. Stack decidido (cambios importantes si se tocan)

| Área | Decisión |
|---|---|
| Framework | **Angular 21** + PrimeNG 21 + `@primeuix/themes` 2 + Tailwind 4 + TS 5.9 |
| ⚠️ Por qué NO Angular 22 | PrimeNG 22 embebió validación de licencia PrimeUI (banner "Invalid PrimeUI License"); sin presupuesto de licencia → nos quedamos fijados en 21. NO actualizar |
| Estado | `@ngrx/signals` oficial + **features propias** (rechazamos NgRx Traits: el equipo quiere ser dueño del código) |
| HTTP | `@angular/build` (builders esbuild/Vite, sin webpack) + contrato .NET en `core/` |
| Testing | Vitest 4 (`ng test --watch=false`), JUnit del runner `@angular/build:unit-test` |
| Seguridad | Web Crypto AES-GCM (nada de crypto-js), tokens cifrados en storage, interceptor con refresh single-flight |
| Utilidades | `date-fns`; `crypto.randomUUID()`; sin Lodash |
| Diferidos a propósito | TanStack Query/Form, Zod/Valibot — solo si aparece dolor real |

## 3. Arquitectura (la constitución)

### ¿Qué es `@ngrx/signals` y por qué está en el stack?

**Qué es**: la librería oficial del org NgRx para gestión de estado con signals de Angular. Su unidad principal es el **`signalStore`**: un store creado por composición de features (`withState`, `withComputed`, `withMethods`, `withHooks`) que se declara como servicio inyectable (`{ providedIn: 'root' }`) y expone signals sincronizadas con la detección de cambios **zoneless** de Angular 21. También existe `signalState` para estado ligero local a un componente.

**Por qué se eligió (y no otra cosa)**:
1. **Es la lib del org oficial de NgRx**: mantenimiento alineado con los majors de Angular y doc sólida — a diferencia de Elf/TanStack (comunidad) o de reescribir el plumbling de signals a mano.
2. **Es signal-nativa**: en Angular 21 (zoneless) el estado en signals se integra de forma nativa con `computed`/`effect`/`@if` en templates. No hay capa extra de "rxjs reactivo" encima.
3. **Composición de features**: el patrón `withState`/`withComputed`/`withMethods`/`withHooks` ES nuestra constitución — estado derivado = `computed` (feature `withComputed`), un solo escritor vía `patchState`, efectos en el propio store (`withHooks`). La librería nos obliga a hacer lo que ya decidimos.
4. **Testabilidad**: los stores se instancian e inyectan en `TestBed`, y se testean como objetos puros (así están los specs actuales de `SessionStore`).
5. **Decisión explícita de límite**: rechazamos **NgRx Traits** (extensiones comunitarias de paginación/filtrado) porque el equipo quiere ser dueño de esa lógica — pero **el núcleo oficial `@ngrx/signals` SÍ se usa** como el esqueleto de todo store. La reutilización propia llega en Fase 3 con la feature casera `withServerTable`.

**Cómo se usa en ESTE proyecto hoy**:
- `core/store/session.store.ts` — el primer (y por ahora único) `signalStore` global: `withState({user, permissions, configLoaded})` + `withComputed(isAuthenticated, permissionMap)` + `withMethods(setUser, setPermissions, markConfigLoaded, reset, hasPermission)`. Lo consumen el menú RBAC (`MenuPermissionService`) y lo escribirán los use-cases de login (Fase 2.4).
- Los stores de pantalla/feature (Fase 3) se construirán igual, componiendo `withServerTable` (feature propia) sobre `@ngrx/signals`.
- El estado transitorio de componentes (`signal`/`computed`) NO requiere la librería — solo los stores que viven como estado compartido.

### Las 4 capas de estado

- **4 capas de estado**: `signal()` local → store por pantalla → `SessionStore` global (`@ngrx/signals`) → `httpResource` para catálogos. El `theme` NO entra al SessionStore (lo posee `LayoutService`).
- **Dirección de dependencias**: `component → store → api-service`. Nunca al revés.
- **Reglas**: derivado = `computed` (nunca estado duplicado) · un solo escritor por campo · efectos en features del store (no en componentes) · los stores no se importan entre sí · solo `TokenAuthService` toca storage.
- **Auth en línea con devueltos (revisión 2026-09-22, equipo)**: el **refresh NO rota** (el backend devuelve solo access nuevo — como devueltos), pero sí se **trackea la expiración del refresh token** (`refreshTokenExpiresIn` en **MINUTOS** — backend confirmó 2026-09-22: el body es la fuente de verdad, NO el `exp` del JWT → `isRefreshTokenExpired()` + short-circuit en `refreshAccess` — la "optimización" pedida; conversión única en `core/utils/token-expiry.ts`). El **fingerprint es un string cualquiera** (UUID por login, `crypto.randomUUID()`, SOLO en el body de login — donde lo manda devueltos; nunca en refresh/otros requests). Rutas públicas: **string mágico `resource: 'Public'`** (como devueltos) + defensa extra "sin resource = pública".
- **Store y IO (decisión 2026-09-22)**: los stores de **sesión** (SessionStore) son puros — escriben solo vía métodos sin IO y exponen queries reactivas; los **use-cases** (login, logout, refresh) orquestan servicios de infra y llaman a los métodos del store; la navegación jamás entra al store (no es estado). En cambio, los stores de **pantalla** (Fase 3, `withServerTable`) SÍ hacen sus fetches en `withMethods` porque el fetch es parte del ciclo de vida de ese estado. Criterio: no es "UI vs no UI", es quién posee el ciclo de vida del estado.
- **Carpetas**: `core/` (interfaces, builders, services, guards, interceptors, helpers, store, constants, utils) · `modules/<feature>/{domain,application,infrastructure,presentation}` · `shared/` (components, pages, directives). Bootstrap en `src/app/` (`main.ts` es lo único en `src/`).

## 4. Dónde estamos

### ✅ Fase 0 — Fundaciones
Stack fijado en 21, demos de Sakai eliminadas, `angular.json` saneado (builder `@angular/build`, lint dentro de `architect`, assets de config), ESLint flat funcionando, Vitest + jsdom, estructura de carpetas con `.gitkeep`, `.gitattributes` (LF), git + GitHub.

### ✅ Fase 1 — Core transversal (COMPLETA, 6 unidades)
| Unidad | Qué | Estado |
|---|---|---|
| 1 | Contratos .NET (`QueryParams`/`PaginatedResponse`/`HttpParamsBuilder` + `defaultQuery()`) | ✅ |
| 2 | `ConfigService` runtime (APP_INITIALIZER, `assets/config.{env}.json`, `HttpBackend` directo) | ✅ |
| 3 | `GenericHttpService` tipado (async, contrato .NET) | ✅ |
| 4 | Web Crypto + `SessionStorageService` + `TokenAuthService` (signals + refresh raw) | ✅ |
| 5 | `AuthInterceptor` (Bearer, 401 **single-flight**, 403, 418; exclusiones **endpoint-específicas**: login/refresh-token/logout van sin Bearer, `user/current` SÍ lo lleva — fix 5850544) | ✅ |
| 6 | `SessionStore` (currentUser, permissions, configLoaded; `hasPermission`/`reset`) | ✅ |

### ⚠️ Fase 2 — Seguridad + layout (EN CURSO)
| Sub | Estado |
|---|---|
| 2.0 Menú español + RBAC reactivo (`core/constants/{menu,actions,resources}`, `MenuPermissionService` sobre SessionStore) | ✅ |
| 2.1 Breadcrumbs + PageTitle (componentes + servicio + wiring en `app.layout`/`app.topbar` + specs) | ✅ |
| 2.1+ Pase de tipado del lote `shared/` copiado de devueltos (async-select[–infinite], chip-navigation, file-upload, filter-*, generic-chart, stat-card, search[-bar], spinner, table-skeleton, info-summary, has-permission, toolbar, permissions-tree, toolbar-slot, breadcrumbs) — **lint 0, 56 tests verdes** | ✅ |
| 2.1+ Mocks demo de devueltos **ELIMINADOS** (`shared/mocks/`) — no se portan | ✅ |
| 2.2 User dropdown + logout en topbar (`LogoutService`: revocación server best-effort `POST /api/auth/logout` `{refreshToken}` vía raw `HttpBackend` + `TokenAuthService.clear()` + `SessionStore.reset()` + redirect `/auth/login`; `UserMenu` con `p-menu` popup alimentado por `SessionStore`; demo Calendar/Messages/Profile y botón ellipsis eliminados) | ✅ verificado 2026-09-21 (lint 0 · 6 specs nuevos verdes · build OK 4.9s) |
| 2.3 Traducción ES de PrimeNG (`translation`) | ✅ verificado 2026-09-22 (`core/constants/primeng-es-translation.ts` tipado con `Translation` de `primeng/api` — NO `primeng/config`, que no re-exporta; wired en `providePrimeNG` de `app.config.ts` + spec de contrato ×3; lint 0 · 9/9 specs del batch verdes · build OK) |
| 2.4 Login real + guards (auth/guest/permission) + directiva `*appHasPermission` sobre SessionStore | ✅ implementado y verificado 2026-09-22 — login real (`POST /api/auth/login` + `GET /api/auth/user/current`, fingerprint `crypto.randomUUID`, use-case `LoginUseCase` hidrata `SessionStore` con permisos aplanados), guards `auth`/`guest`/`permission` (público sin `data.resource`, default `Read`, redirect `/auth/access`), login page ES con form reactivo + `p-message` de error + `returnUrl`, wiring en `auth.routes` con `guestGuard`; duplicados demo de `shared/pages` (access/error/empty) ELIMINADOS. Gates: lint 0 · 13/13 specs nuevos · build OK. ⚠️ Pendiente acoplado: verificación runtime de la directiva `*appHasPermission` reescrita — depende de que se aplique manualmente la unificación RBAC (§5.1) |
| 2.5 Módulo de seguridad (usuarios/roles/auditorías/configuración) + rutas con `data: { title, breadcrumb }` | 🔲 |
| 2.6 (media) Persistencia de layout, overlay de carga, chips historial, inactivity | 🔲 |

**Tests actuales: 88** (verificado 2026-09-22) — incluye +2 tests de regresión del interceptor (exclusiones endpoint-específicas) y +1 del contrato MINUTOS de lifetimes, sobre la base de 85 verde previa.

### ✅ Verificación Fase 2.2 — COMPLETA (2026-09-21, esta PC)

- `ng lint` → 0 · specs nuevos `--include='**/{logout.service,app.user-menu}.spec.ts'` → **6/6 verdes** · `ng build` → completo (4.9s, `dist/sakai-ng`).
- **Toolchain resuelto en ESTA PC**: el shim `pnpm.exe` de nvm (sin versiones) fue renombrado a `pnpm.exe.broken-nvm-shim`; el global npm expone **pnpm 10.34.5** y `pnpm exec ng ...` funciona directo (lockfile 9.0 intacto). NO usar pnpm@12 global — migraría el lockfile.
- **Bugs encontrados y corregidos durante la verificación** (lecciones para futuros specs):
  - `vi.fn()` sin tipar no asigna a `Router['navigate']` (TS2345) → tipar con `vi.fn<Router['navigate']>()`.
  - **Carrera en specs con requests async**: `expectOne` corrió antes de que el POST saliera (la lectura de storage demora el dispatch) → envolver con `await vi.waitFor(() => httpMock.expectOne(url))`.
- Pendiente (opcional, no bloqueante): una corrida completa de la suite (62) — los specs corren ~1.5s por archivo; si molesta el arranque por archivo, evaluar `isolate: false` en la config de vitest.
- Pendiente de validar contra backend real (cuando haya login, 2.4): casing del body de logout (`{ refreshToken }` camelCase según devueltos; el refresh usa `{ RefreshToken }` PascalCase — .NET bindea case-insensitive).

## 5. Lo que falta (orden recomendado)

1. **Unificar RBAC sobre `SessionStore`** (decisión TOMADA con el equipo — **PENDIENTE DE APLICAR MANUALMENTE**):
   - Realidad verificada en disco (2026-09-21): **NO hay dos `TokenAuthService`** — la "copia de devueltos" (`modules/auth/...`) y `PermissionService` NUNCA existieron. El problema real son **3 archivos huérfanos con imports fantasma** (pasan lint/build solo porque `tsconfig.app.json` arranca en `main.ts` y nadie los importa): `has-permission.directive.ts` y `toolbar.component.ts` → importan `PermissionService` + `modules/.../token-auth.service`; `chip-navigation-history/quick-access.service.ts` → importa `modules/auth/services/auth.service`.
   - Decisión (opción A): **no se recrea `PermissionService`**. Directiva y toolbar se reescriben contra `SessionStore.hasPermission` (signal inputs + `computed` + `effect`, contexto `{ ok }` — resuelve también el ítem 3). Bypass `'Public'` NO se porta (no está en `RESOURCES`; el guard de 2.4 tratará ruta sin `data.resource` como pública). `quick-access` se reescribe en 2.6 (chips). La spec completa para aplicar quedó entregada en la conversación (directiva reescrita + spec + cambios de toolbar + commits sugeridos).
2. **Duplicados de páginas demo**: ✅ RESUELTO en 2.4 — `pages/auth/` es la real (login ES + guards); los duplicados demo de `shared/pages/` (`access`, `error`, `empty`) fueron ELIMINADOS; queda solo `notfound` (único importado por `app.routes`).
3. **`has-permission.directive`**: se resuelve con la reescritura del ítem 1 (contexto `{ ok }` en `createEmbeddedView`). Mientras no se aplique, sigue el estado previo (microsintaxis renombrada, runtime sin verificar).
4. Verificar 2.2 (bloque de arriba) y luego Fase 2.3 → 2.6 (tabla de arriba).
5. **Fase 3**: `withServerTable` (feature propia con tests: stale responses, page cache) + shared UI (tabla, toolbar, filtros, async-select, skeletons) + catálogos con `httpResource`.
6. **Fase 4**: screen piloto end-to-end validando el patrón completo.

## 6. Runbook (en la otra PC)

```powershell
pnpm install                # lockfile versionado
pnpm exec ng serve          # dev (config.development.json → serverApi en localhost:1235)
pnpm exec ng test --watch=false
pnpm exec ng lint
pnpm exec ng build
```

- **pnpm**: usar siempre `pnpm exec ng ...` (los binarios no están en el PATH de shell). pnpm es estricto con peer deps: si un `pnpm add` avisa de peers, es real.
- **Esta PC (claudia.alfonso, única en uso desde 2026-09-22)**: pnpm global fijado en **10.34.5** (la 12.4.2 que venía del npm global fue degradada; lockfile v9 intacto). `pnpm exec ng ...` funciona directo. El repo git vive en esta carpeta (`.git` restaurado desde la copia 'salva' el 2026-09-22).
- Git workflow: trabajar en la rama `feat/core-foundation`; commits por unidad; al final PR a `main`.

## 7. Gotchas y lecciones (léase antes de tocar)

- **Angular 22 NO**: PrimeNG 22 valida licencia PrimeUI por red + banner.
- **Reversión vivida**: actualizamos a 22 y volvimos a 21 (costó un rollback completo). No repetir sin precio de licencia.
- **`angular.json`**: builders = `@angular/build:application|dev-server|extract-i18n|unit-test`; `runnerConfig: "vitest-base.config.ts"` en test; target `lint` dentro de `architect` (se reparó: quedaba fuera y el CLI decía "extension with invalid name (lint)").
- **ESLint**: overrides por archivo justificados → `app.menuitem` (selector de atributo, necesario para el layout) y `filter-select` (label dentro de `<p-floatlabel>`, `eslint-disable-next-line` documentado).
- **El wrapper de PowerShell de este entorno** manglea salidas ricas en "N matches in N files": para ver errores reales redirigir a archivo y leer (`... > log.txt 2>&1`).
- **Renames ya aplicados** (si buscas un nombre viejo): outputs `onXxx` → nombres semánticos (`searchParams`, `searchSubmitted`, `created`, `action`, `resetFilters`); selectors sin prefijo → `app-*` (`[appHasPermission]`, `[appToolbarSlot]`, `app-permissions-tree`); inputs `@Input('alias')` → sin alias (`hasPermissionResource`/`hasPermissionActions`).
- **Regla de trabajo del equipo**: comunicar los cambios ANTES de aplicarlos y preguntar si la persona los hace manualmente. Con git, el diff es la narrativa.
- **Exclusiones de auth: endpoint-específicas, NUNCA prefijo de controller** (lección runtime 2026-09-22): el prefijo `/api/auth/` excluyó también `user/current` (que SÍ es autenticado) y rompió el login con un 401 silencioso. Mismo tipo de trampa en unidades: `expiresIn`/`refreshTokenExpiresIn` son **MINUTOS** (confirmado por el backend); devueltos asumía segundos. El `exp` interno del JWT NO es la fuente de verdad del contrato del body. Ambos contratos quedaron clavados con tests de regresión.