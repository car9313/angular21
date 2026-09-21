# Estado del Proyecto — Sakai NG (Angular 21)

> Documento de continuidad. Fecha: 2026-09-21 · Rama: `feat/core-foundation`
> Cualquier máquina: `git pull` + `pnpm install` (el lockfile está versionado) y correr los gates del final.

---

## 1. Objetivo

Construir una aplicación **Angular premium, escalable y mantenible** que reutilice el **mismo cascarón de seguridad y layout** de la app "Devueltos" (referencia: `D:\Trabajo\Proyectos\TFS\DEVUELTO\devueltos_ui`), pero **reconstruido con mejores prácticas modernas**.

**Regla de oro: devueltos es REFERENCIA, no código a copiar.** De él se extrae conocimiento de dominio (contrato de paginación .NET, modelo RBAC, flujo de auth, edge cases); su deuda NO se porta (crypto-js, `any` a granel, widgets demo, código muerto, BehaviorSubject duales).

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

- **4 capas de estado**: `signal()` local → store por pantalla → `SessionStore` global (`@ngrx/signals`) → `httpResource` para catálogos. El `theme` NO entra al SessionStore (lo posee `LayoutService`).
- **Dirección de dependencias**: `component → store → api-service`. Nunca al revés.
- **Reglas**: derivado = `computed` (nunca estado duplicado) · un solo escritor por campo · efectos en features del store (no en componentes) · los stores no se importan entre sí · solo `TokenAuthService` toca storage.
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
| 5 | `AuthInterceptor` (Bearer, 401 **single-flight**, 403, 418, exclusiones `/api/auth/`) | ✅ |
| 6 | `SessionStore` (currentUser, permissions, configLoaded; `hasPermission`/`reset`) | ✅ |

### ⚠️ Fase 2 — Seguridad + layout (EN CURSO)
| Sub | Estado |
|---|---|
| 2.0 Menú español + RBAC reactivo (`core/constants/{menu,actions,resources}`, `MenuPermissionService` sobre SessionStore) | ✅ |
| 2.1 Breadcrumbs + PageTitle (componentes + servicio + wiring en `app.layout`/`app.topbar` + specs) | ✅ |
| 2.1+ Pase de tipado del lote `shared/` copiado de devueltos (async-select[–infinite], chip-navigation, file-upload, filter-*, generic-chart, stat-card, search[-bar], spinner, table-skeleton, info-summary, has-permission, toolbar, permissions-tree, toolbar-slot, breadcrumbs) — **lint 0, 56 tests verdes** | ✅ |
| 2.1+ Mocks demo de devueltos **ELIMINADOS** (`shared/mocks/`) — no se portan | ✅ |
| 2.2 User dropdown + logout en topbar | 🔲 |
| 2.3 Traducción ES de PrimeNG (`translation`) | 🔲 |
| 2.4 Login real + guards (auth/guest/permission) + directiva `*appHasPermission` sobre SessionStore | 🔲 |
| 2.5 Módulo de seguridad (usuarios/roles/auditorías/configuración) + rutas con `data: { title, breadcrumb }` | 🔲 |
| 2.6 (media) Persistencia de layout, overlay de carga, chips historial, inactivity | 🔲 |

**Tests actuales: 56 verdes** (builder, config, http, token, interceptor, session store, menu RBAC, breadcrumbs, page-title, smoke).

## 5. Lo que falta (orden recomendado)

1. **Reconciliar DOS `TokenAuthService`** (CRÍTICO — conflicto arquitectónico real):
   - `core/services/token-auth.service.ts` — **v2, el que usa el interceptor** (nuestra implementación). ✅
   - `modules/auth/infrastructure/storage/token-auth.service.ts` — copia de devueltos (con `userRoles` y demás) usada por `has-permission.directive` y `toolbar`. ⚠️
   - Decisión: unificar en la v2 + leer roles/permisos de `SessionStore`, o reescribir la directiva/`PermissionService` contra el core. **Pendiente de decidir con el equipo.**
2. **Duplicados de páginas demo**: `error.ts`/`access.ts` existen en `pages/auth/` (las usadas por `auth.routes`) y también en `shared/pages/`. Cuando se construya el login real (2.4→2.5) se decide cuál queda y se borra el demo.
3. **`has-permission.directive`**: la microsintaxis `*appHasPermission="let ok; hasPermissionResource: ...; hasPermissionActions: ..."` quedó **renombrada y lint-clean, pero sin verificar en runtime** que `createEmbeddedView` entregue contexto (`ok`). Verificar comportamiento en Fase 2.4.
4. Fase 2.2 → 2.6 (tabla de arriba).
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
- Git workflow: trabajar en la rama `feat/core-foundation`; commits por unidad; al final PR a `main`.

## 7. Gotchas y lecciones (léase antes de tocar)

- **Angular 22 NO**: PrimeNG 22 valida licencia PrimeUI por red + banner.
- **Reversión vivida**: actualizamos a 22 y volvimos a 21 (costó un rollback completo). No repetir sin precio de licencia.
- **`angular.json`**: builders = `@angular/build:application|dev-server|extract-i18n|unit-test`; `runnerConfig: "vitest-base.config.ts"` en test; target `lint` dentro de `architect` (se reparó: quedaba fuera y el CLI decía "extension with invalid name (lint)").
- **ESLint**: overrides por archivo justificados → `app.menuitem` (selector de atributo, necesario para el layout) y `filter-select` (label dentro de `<p-floatlabel>`, `eslint-disable-next-line` documentado).
- **El wrapper de PowerShell de este entorno** manglea salidas ricas en "N matches in N files": para ver errores reales redirigir a archivo y leer (`... > log.txt 2>&1`).
- **Renames ya aplicados** (si buscas un nombre viejo): outputs `onXxx` → nombres semánticos (`searchParams`, `searchSubmitted`, `created`, `action`, `resetFilters`); selectors sin prefijo → `app-*` (`[appHasPermission]`, `[appToolbarSlot]`, `app-permissions-tree`); inputs `@Input('alias')` → sin alias (`hasPermissionResource`/`hasPermissionActions`).
- **Regla de trabajo del equipo**: comunicar los cambios ANTES de aplicarlos y preguntar si la persona los hace manualmente. Con git, el diff es la narrativa.