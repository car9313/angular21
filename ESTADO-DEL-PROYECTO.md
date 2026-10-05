# Estado del Proyecto — Sakai NG (Angular 21)

> Documento de continuidad. Fecha: 2026-10-01 · Rama: `feat/core-foundation`
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
| **HTTP contract (decisión 2026-09-24)** | `GenericHttpService` devuelve **`Observable`** (NO Promise) — decisión de equipo para que `rxMethod` + `switchMap` cancelen requests en flight en stores de pantalla. Los specs levantan el valor con `firstValueFrom(...)` y esperan `expect(() => service.getAll(...)).toThrow()` cuando no hay config (el throw es SÍNCRONO: `url()` se evalúa al construir el Observable). Repositorios de features (`RoleRepository`) propagan `Observable` naturalmente |
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
| 6+ | **Restauración de sesión**: `SessionReadyService` (barrera one-shot en `core/guards/`) — el primer guard dispara `RestoreSessionUseCase` (tokens → `user/current` → store; fail closed) y todos los guards esperan la misma promesa. SIN `APP_INITIALIZER` (un solo dueño; evita doble `user/current` al boot). Fix del bounce F5→login (commit post-975e9e0) | ✅ |

### ⚠️ Fase 2 — Seguridad + layout (EN CURSO)
| Sub | Estado |
|---|---|
| 2.0 Menú español + RBAC reactivo (`core/constants/{menu,actions,resources}`, `MenuPermissionService` sobre SessionStore) | ✅ (+ fix 2026-09-24: `path` en cada item de `MENU_ITEMS` — sin `path` el submenú "Seguridad" nunca se despliega; `app.menuitem` solo expande grupos con `isActive()`, que depende de `path`) |
| 2.1 Breadcrumbs + PageTitle (componentes + servicio + wiring en `app.layout`/`app.topbar` + specs) | ✅ |
| 2.1+ Pase de tipado del lote `shared/` copiado de devueltos (async-select[–infinite], chip-navigation, file-upload, filter-*, generic-chart, stat-card, search[-bar], spinner, table-skeleton, info-summary, has-permission, toolbar, permissions-tree, toolbar-slot, breadcrumbs) — **lint 0, 56 tests verdes** | ✅ |
| 2.1+ Mocks demo de devueltos **ELIMINADOS** (`shared/mocks/`) — no se portan | ✅ |
| 2.2 User dropdown + logout en topbar (`LogoutService`: revocación server best-effort `POST /api/auth/logout` `{refreshToken}` vía raw `HttpBackend` + `TokenAuthService.clear()` + `SessionStore.reset()` + redirect `/auth/login`; `UserMenu` con `p-menu` popup alimentado por `SessionStore`; demo Calendar/Messages/Profile y botón ellipsis eliminados) | ✅ verificado 2026-09-21 (lint 0 · 6 specs nuevos verdes · build OK 4.9s) |
| 2.3 Traducción ES de PrimeNG (`translation`) | ✅ verificado 2026-09-22 (`core/constants/primeng-es-translation.ts` tipado con `Translation` de `primeng/api` — NO `primeng/config`, que no re-exporta; wired en `providePrimeNG` de `app.config.ts` + spec de contrato ×3; lint 0 · 9/9 specs del batch verdes · build OK) |
| 2.4 Login real + guards (auth/guest/permission) + directiva `*appHasPermission` sobre SessionStore | ✅ implementado y verificado 2026-09-22 — login real (`POST /api/auth/login` + `GET /api/auth/user/current`, fingerprint `crypto.randomUUID`, use-case `LoginUseCase` hidrata `SessionStore` con permisos aplanados), guards `auth`/`guest`/`permission` (público sin `data.resource`, default `Read`, redirect `/auth/access`), login page ES con form reactivo + `p-message` de error + `returnUrl`, wiring en `auth.routes` con `guestGuard`; duplicados demo de `shared/pages` (access/error/empty) ELIMINADOS. Gates: lint 0 · 13/13 specs nuevos · build OK. ⚠️ Pendiente acoplado resuelto: la directiva quedó verificada al aplicar la unificación RBAC (§5.1, serie `540334e..565bcd8`) |
| 2.5 Módulo de seguridad (usuarios/roles/auditorías/configuración) + rutas con `data: { title, breadcrumb }` | ✅ roles completo: `RoleListStore` (composición `withQuery`/`withListStatus`/`withFilters`/`withFiltersPersistence`/`withModal`/`withSelection`), `RoleTableComponent`, `RoleFiltersComponent`, CRUD con diálogos (`RoleNameDialog` con seed de edición, `RolePermissionsDialog` + `RolePermissionsStore` dedicado — no se infló `RoleListStore`), permisos por rol (`PermissionsTreeMapperService` extendido, `computeSelectedNodes` con `Set` O(1)), menú rowActions "Permisos". **Verificado contra backend real 2026-09-30**. **Pantalla Configuración ✅ implementada y verificada 2026-10-05** (residual pendiente de usuarios/auditorías): dominio `security-settings` (`SETTINGS_RULES` + `makeSecuritySettings` + igualdad tipada sin JSON), `SettingsRepository` (`/api/app-settings` GET/POST), `SettingsStore` root-scoped, 4 secciones (general/auth/password/user) + diálogo ensamblador. **RBAC: recurso `SecConfig` con acción `Update`** (NO `Read`) en `menu.ts` y `settings.routes.ts` — con `Read` el ítem del menú quedaba oculto. **Validación**: opción B (errores al tocar el campo o al intentar guardar vía `markAllAsTouched`, sin sync por tecla); borde rojo con `[ngClass]="{'ng-invalid ng-dirty': invalid(...)}"` + mensajes `text-red-500` (PrimeNG 21 no estiliza `p-invalid`); override CSS global para que el rojo se mantenga CON foco (gotcha §7, estándar §8 / `docs/estandar-validacion-formularios.md`). Gates: lint 0 · **173/173 tests** · build OK |
| 2.6 (media) Persistencia de layout, overlay de carga, chips historial, inactivity | ✅ **COMPLETA 2026-10-01**: `LayoutService` persiste `layoutConfig` + sidebar colapsado en `localStorage` (`sakai.layout.config`, try/catch en JSON corrupto, cero escrituras si no cambió — `lastPersisted` arranca con lo restaurado o el default serializado; dark mode inicial síncrono en constructor + effect que decide transición comparando contra el DOM, sin flag `initialized`); `InactivityService` (15 min, debounce 1 s, `clearTimer` antes de rearmar — sin carrera, montado en `AppLayout` OnInit/OnDestroy, no-op sin sesión). Overlay de carga y chips historial ya estaban. Specs: 7 layout + 5 inactivity |

**Tests actuales: 173** (verificado 2026-10-05) — lint 0 · 173/173 (35 archivos) · build OK. Historial: 94 (2026-09-24) → 137 pre-Fase-2.6 → 144 (2026-10-01, specs de `LayoutService`/`InactivityService`) → 173 con los specs del módulo Configuración (domain + repository + store + dialog, incl. test de opción B).

### ✅ Verificación Fase 2.2 — COMPLETA (2026-09-21, esta PC)

- `ng lint` → 0 · specs nuevos `--include='**/{logout.service,app.user-menu}.spec.ts'` → **6/6 verdes** · `ng build` → completo (4.9s, `dist/sakai-ng`).
- **Toolchain resuelto en ESTA PC**: el shim `pnpm.exe` de nvm (sin versiones) fue renombrado a `pnpm.exe.broken-nvm-shim`; el global npm expone **pnpm 10.34.5** y `pnpm exec ng ...` funciona directo (lockfile 9.0 intacto). NO usar pnpm@12 global — migraría el lockfile.
- **Bugs encontrados y corregidos durante la verificación** (lecciones para futuros specs):
  - `vi.fn()` sin tipar no asigna a `Router['navigate']` (TS2345) → tipar con `vi.fn<Router['navigate']>()`.
  - **Carrera en specs con requests async**: `expectOne` corrió antes de que el POST saliera (la lectura de storage demora el dispatch) → envolver con `await vi.waitFor(() => httpMock.expectOne(url))`.
- Pendiente (opcional, no bloqueante): una corrida completa de la suite (62) — los specs corren ~1.5s por archivo; si molesta el arranque por archivo, evaluar `isolate: false` en la config de vitest.
- Pendiente de validar contra backend real (cuando haya login, 2.4): casing del body de logout (`{ refreshToken }` camelCase según devueltos; el refresh usa `{ RefreshToken }` PascalCase — .NET bindea case-insensitive).

## 5. Lo que falta (orden recomendado)

0. **Limpieza lote manual 2026-09-24 (lista de cambios revisados por orquestador)** — ✅ HECHO:
   - `styles.scss`: eliminados outlines debug `lime/red/blue !important` y `font-size: 1.2rem` de body (vuelto a 1rem).
   - `role-repository.ts`: eliminado `tap(console.log)` de `list()`.
   - `app-user-menu.ts` (nuevo, sin punto) **ELIMINADO** — colisionaba el selector `app-user-menu` con `app.user-menu.ts` (el usado por el topbar).
   - `session.store.ts`: eliminado bloque de "notas de trabajo" en español; la advertencia del cache vive ahora como doc en `TableActionMenuService`.
   - `resources.ts`: comillas uniformes, sin línea vacía extra.
   - Specs alineados al contrato: `menu-permission.service.spec` usa `RESOURCES` reales (`'User'`, `'Role'`), `http-params-builder.spec` completa `QueryParams` (filter/sort obligatorios), `generic-http.service.spec` reescrito a Observables, `app.user-menu.spec` busca `'Cerrar sesión'`.
   - Lint: `NotificationService` con `inject()` (no constructor), eliminados `any`, output `selectRow` (no nativo `select`), `withHooks.onInit` sin `store` sin usar.

0b. **Refactor roles 2026-09-24 (optimización/escalabilidad, revisado por orquestador)** — ✅ HECHO:
   - `RoleListComponent` (`app-role-list`, contenedor huérfano duplicado) **ELIMINADO** — la pantalla real es `RolesPage`.
   - `RoleListStore.load` ahora es `rxMethod<QueryParams>`: la query entra POR INPUT (los coordinadores pasan `store.query()`); ya no se lee el estado dentro del `switchMap`. Eliminado el computed muerto `totalRecords` (placeholder que nunca se sobrescribía) y el `withHooks.onInit` vacío.
   - `PermissionService` movido de `core/interfaces/` → `core/services/` (regla de carpetas: servicios en `core/services/`). `column-config.ts` actualizado.
   - ⚠️ Pendiente sin tocar: `has-permission.directive.ts` y `toolbar.component.ts` siguen con imports fantasma (`modules/auth/infrastructure/storage/token-auth.service` y `permission.service` desde `core/services/` — el real existe pero `TokenAuthService` NO expone `userRoles`) — son scope de la unificación RBAC (§5.1), nadie los importa hoy.
 
1. **Unificar RBAC sobre `SessionStore`** — ✅ **APLICADO** (serie `540334e..565bcd8`): directiva `*appHasPermission` reescrita sobre `SessionStore.hasPermission` (contexto `{ ok }`), imports fantasma de `has-permission.directive.ts`/`toolbar.component.ts`/`quick-access.service.ts` eliminados, guard `permission` unificado. `PermissionService` NO se recreó (decisión opción A). Bypass `'Public'` no portado: ruta sin `data.resource` es pública.
2. **Duplicados de páginas demo**: ✅ RESUELTO en 2.4 — `pages/auth/` es la real (login ES + guards); los duplicados demo de `shared/pages/` (`access`, `error`, `empty`) fueron ELIMINADOS; queda solo `notfound` (único importado por `app.routes`).
3. **`has-permission.directive`** — ✅ resuelto con el ítem 1 (contexto `{ ok }` en `createEmbeddedView`).
4. ~~Verificar 2.2 y luego Fase 2.3 → 2.6~~ — ✅ todas las sub-fases de Fase 2 completadas (2.0→2.6).
5. **Fase 2.5 residual**: pantallas de usuarios y auditorías (roles ✅ completo; **configuración ✅ 2026-10-05**, ver §4 fila 2.5).
6. **Fase 3**: `withServerTable` (feature propia con tests: stale responses, page cache) + shared UI (tabla, toolbar, filtros, async-select, skeletons) + catálogos con `httpResource`.
7. **Fase 4**: screen piloto end-to-end validando el patrón completo.
8. Actualizar `ESTADO-DEL-PROYECTO.md` al cierre de cada bloque (⚠️ este doc se desactualizó durante 2026-09-30; actualizado 2026-10-01).

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
- **Protocolo git seguro (2026-09-30, CRÍTICO)**: el índice puede arrastrar cambios staged de sesiones previas → **SIEMPRE** `git add -- <paths>` + `git commit -m "msg" -- <pathspec explícito>` + verificar con `git show --stat HEAD`. `git commit -- <path>` SOLO con archivos ya trackeados (pathspec sobre no-trackeados falla; el add va aparte). Nunca `git add .`.
- **Effects en tests zoneless (2026-10-01)**: los effects de servicios root no corren solos en specs → `TestBed.flushEffects()` (API oficial de Angular 21), NO `vi.waitFor` ni timers adivinados. Para crear servicios fuera de DI: `TestBed.runInInjectionContext(() => new LayoutService())`.
- **No portar `initialized` flag de Sakai** (2026-10-01): el `LayoutService` original usaba un flag "primera vez" para evitar transición en el boot — frágil (si el primer flush llegaba después de un update, se comía el cambio). Mejor: aplicar el dark inicial síncrono en el constructor y que el effect compare `classList.contains('app-dark') === config.darkTheme` — el DOM es la verdad, sin estado extra. Lección general: si un test cuesta, cuestionar la implementación antes de forzar el test (feedback del usuario 2026-10-01, seguirlo).
- **Idempotencia de persistencia**: `lastPersisted` se inicializa con lo YA guardado en storage o con el default serializado → cero escrituras en boot sin cambios y cero re-escrituras de defaults.
- **PrimeNG 21: el borde rojo de inválido desaparece con foco (2026-10-05)** — el CSS runtime de PrimeNG pisa el color de error en cuanto el input tiene foco: `p-inputnumber.ng-invalid.ng-dirty > .p-inputtext:enabled:focus { border-color: <color-de-foco> }` (mismo patrón en `p-password`). Síntoma: el mensaje "El campo es requerido" se ve pero el borde solo se pone rojo al hacer click afuera (blur). **Fix GLOBAL** (decisión 2026-10-05, sin `!important`): regla en `src/assets/styles.scss` con prefijo `html` → especificidad (0,5,2) contra (0,5,1) de PrimeNG. ⚠️ El prefijo `html` NO es decorativo: sin él empatan, y PrimeNG inyecta sus `<style>` al final de `<head>` (`UseStyle.use()` con `first=false`), después de nuestro `<link>` → PrimeNG ganaría por orden. Token `--p-inputtext-invalid-border-color` (prefix `p` de `@primeuix/styled`, tema Aura `inputtext.invalidBorderColor`) ya está en `:root` y respeta dark mode; fallback `#f87171`. Related: PrimeNG 21 tampoco estiliza `p-invalid` ni `p-error` (0 reglas en su CSS) — el estado visual se declara con clases `ng-invalid ng-dirty` + Tailwind, nunca esperando estilos del tema. **Estándar completo → `docs/estandar-validacion-formularios.md` (§8)**.

## 8. Estándar de validación de formularios

**Fuente completa y checklist: [`docs/estandar-validacion-formularios.md`](docs/estandar-validacion-formularios.md)** — léelo antes de crear cualquier formulario con validación (aplica a pantallas nuevas de Fase 2.5+ y 3).

Resumen (las 4 reglas):
1. **Clase de estado**: `[ngClass]="{ 'ng-invalid ng-dirty': <c>.invalid && (<c>.dirty || <c>.touched) }"` en el host del campo. Nunca `p-invalid`; nunca solo `ng-invalid` (PrimeNG exige la pareja `ng-invalid`+`ng-dirty`, y Angular solo pone `ng-dirty` si el valor cambió).
2. **Mensaje**: `<small class="block mt-1 text-red-500 dark:text-red-400">`. Nunca `class="p-error"` (PrimeNG 21 no lo estiliza → texto sin color).
3. **Al guardar inválido**: `form.markAllAsTouched()` y no emitir/persistir (opción B: errores al tocar o al guardar, sin sync por tecla).
4. **Botón**: `[disabled]="saving() || !dirty()"`.

El override del borde rojo con foco es **global** en `styles.scss` (ver gotcha §7) — las pantallas nuevas no tienen que declarar nada extra, solo cumplir la regla 1.

## 9. Lenguaje visual corporativo y pulido UX (trabajo pre-existente)

Bloque de personalización visual incorporado sobre el tema Aura de Sakai antes de Fase 2.5, enfocado en identidad de marca, accesibilidad y densidad. Quedó commitado en unidades lógicas (ver §5 "git workflow"). Resumen por bloque:

### 9.1 Theme `CorporatePreset` — single source of truth del brand
- `src/app/theme/corporate.preset.ts` (nuevo) + `corporate.preset.spec.ts`: `definePreset(Aura, …)` con `CORPORATE_PRIMARY = 'emerald'` por defecto.
- **Tokens estructurales** `CORPORATE_TOKENS`: escala de `borderRadius` enterprise-tight (`2/4/4/6/8` vs Aura `2/4/6/8/12`) — un solo override retunea cards, inputs, botones, menús, popovers y modales; `semantic.primary` mapea `CORPORATE_PRIMARY` sobre los stops 50..950 de Aura, así todo el esquema light/dark sigue a la paleta.
- **Boot**: `app.config.ts` pasa `preset: CorporatePreset` a `providePrimeNG` (`darkModeSelector: '.app-dark'`). **Runtime**: `app.configurator.ts` `getPresetExt()` fusiona `CORPORATE_TOKENS` con el primary elegido en cada cambio — cambiar preset/primary en el configurator nunca pierde la escala de radius del brand, mientras el color elegido sobrescribe el default corporativo (persistido en localStorage, gana sobre el default hasta reset).
- Para cambiar el color de marca: editar `CORPORATE_PRIMARY` (nombre de paleta Aura) y reiniciar; para un hex custom reemplazar `semantic.primary` con una paleta 50..950 completa.

### 9.2 Topbar + user-menu — accesibilidad y chips corporativos
- `app.topbar.ts`: cada botón ahora con `type="button"`, `aria-label` dinámico y `pTooltip` (`appendTo="body"`, `tooltipPosition="bottom"`); tooltips: "Alternar menú lateral", "Activar/desactivar modo oscuro", "Personalizar apariencia". SVG del logo usa `var(--topbar-glyph)`. Nuevo `app.topbar.spec.ts`.
- `_topbar.scss`: introduce variables `--topbar-glyph`, `--topbar-glyph-hover`, `--topbar-chip`, `--topbar-chip-content`, `--topbar-chip-hover`; glyphs de la barra en blanco con hovers/focus blancos a través de `--focus-ring-color`. ⚠️ **Caveat documentado en el propio archivo**: blanco sobre emerald-500 mide 2.56:1 (bajo el 3:1 de WCAG 1.4.11); si se exige AA, oscurecer la barra a primary-700 en vez de cambiar el glyph de vuelta.
- `app.user-menu.ts`: trigger cambió de avatares de iniciales a icono `pi-user` con `aria-label` "Menú de usuario" + tooltip; chip de usuario con colores corporativos (`--topbar-chip*`). Spec actualizado (`app.user-menu.spec.ts`).
- `_menu.scss`: sidebar más compacto (`top: 4rem`, `left: 0`, `height: calc(100vh - 4rem)`).

### 9.3 Toolbar + roles table — variante con label y densidad
- `toolbar.component` (`html/ts/spec`): nueva variante de botón de alta **con label visible** (`config().addLabel`, p. ej. "Nuevo Rol") — la convención enterprise: un "+" solo es ambiguo en toolbars anchos; nombre accesible en el `<button>` interno. El `toolbar-start`/`span.flex-1` se empujaron al final para que el cluster (alta + búsqueda) quede a la derecha. La variante icon-only heredada (sin `addLabel`) se conserva para pantallas sin label.
- `role-table` (`html/ts`): tabla `size="small"`, `rowsPerPageOptions` solo visible cuando hay más de una página posible (`visibleRowsPerPageOptions` — mostrar "10" cuando todo cabe en la página confunde), `searchText` input que distingue "Sin resultados" de "Sin datos", tooltip "Listado de Acciones" con `ariaLabel` por fila, textos de empty-state en español.
- `roles.page.ts`: columna `ID` **eliminada** (ruido visual para el usuario de negocio — queda solo "Nombre"); acción de **eliminar marcada `severity: 'danger'`**.

### 9.4 Acciones destructivas en rojo — `severity` en el modelo de tabla
- `table-action.ts`: `TableAction<T>` admite `severity?: 'danger'` (PrimeNG v21 `MenuItem` no tiene campo `severity`).
- `table-action-menu.ts`: lo mapea a color rojo al construir el popup; `DANGER_COLOR = '#dc2626'` (red-600, 4.8:1 en superficies claras, WCAG AA) como **literal** porque las variables del tema runtime no son confiables para severidad en contenidos, y el popup renderiza con `appendTo="body"` (escapa todo stylesheet por CSS variables → el estilo inline es el único override que sobrevive).

### 9.5 Paginación default PageSize 10 → 5 + persistencia versionada
- `query-params.ts` `defaultQuery()` y `with-query.feature.ts` `DEFAULT_QUERY`: `PageSize` pasa de `10` a `5` (menos ruido visual con la tabla `size="small"`).
- `with-filters-persistence.feature.ts`: **`STORAGE_VERSION` 1 → 2** — incrementar también cuando cambian **defaults de paginación** (no solo el shape): un payload viejo restauraría el `PageSize` anterior y pisaría el nuevo default. Los specs de `http-params-builder` se ajustaron al nuevo default.

### 9.6 Login dark-mode derivado del primary
- `login.ts`: elimina el template demo comentado (bloque muerto) y declara `styles` propios. Los acentos dark derivan de `--primary-color` (vía `CORPORATE_PRIMARY`), **nunca** de hexes fijos — cambiar el primary y el login lo sigue solo.
- `:host` define `--login-field-border` y `--login-card-ring` por `color-mix` con el primary; `:host-context(.app-dark)` tinta los `.p-inputtext` (el borde dark default ~1.7:1 se pierde contra la card profunda) y da anillo a `.login-card`. Estados invalid/focus conservan sus colores de mayor especificidad.
- Fondo con `dark:bg-[color-mix(...)]`, card `bg-primary-50 dark:bg-primary-950`, labels y errores con variantes `dark:`. (Los textos de error y el username cumplen además el estándar de validación §8.)