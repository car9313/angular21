# Plan diario — Sakai NG

> **Fecha: 2026-10-27** · Rama: `feat/core-foundation`
> Archivo rotativo. Al cerrar el mes, mover el histórico a `docs/bitacora/` (ver `README.md`) y dejar aquí el día actual.
> Estados: `[ ]` pendiente · `[~]` en curso · `[x]` hecho · `[!]` bloqueado.

---

## Objetivo del día

Estabilizar **Nomencladores/Países** con el alcance confirmado: **crear, editar, ver detalles y activar/desactivar** (sin eliminación física), corrigiendo menú, ruta y permisos, y dejando los gates verdes con pruebas de valor.

## Alcance confirmado (2026-10-23)

- **Sí:** alta, edición, detalle, búsqueda, paginación y toggle activo/inactivo.
- **No:** eliminación física. La baja de un país es su **desactivación**.
- **Detalle:** `GET /api/country/{id}` con skeleton y reintento.
- **Activación:** `PUT /api/country/activate/{id}`; **desactivación:** `DELETE /api/country/{id}` (contrato confirmado por el usuario; **pendiente de verificación real** — BE-004).
- **Permisos:** alta = `Create`, edición y toggle = `Update`, detalle = `Read`, sobre `RESOURCES.Nomenclators`.
- **Fuera de esta tanda:** consolidación de `security.routes.ts` (SEC-003/SEC-004), login/topbar/panel e higiene git.

## Plan de ejecución

| Fase | ID | Tarea | Estado | Verificación |
|---|---|---|---|---|
| 0 | GATE-001 | Añadir imports de `vitest` y reemplazar el boilerplate de `country-table.spec.ts`, `countries.page.spec.ts` y `logo.spec.ts` | [x] | La suite compila y ejecuta |
| 0 | GATE-002 | Lint: quitar `any` en `action-toolbar.component.ts:42`, limpiar métodos muertos de `country-table.ts` y resolver los `label` de `country-details.html` | [x] | `ng lint` = 0 |
| 0 | GATE-003 | Correr los 3 gates y corregir fallos preexistentes que aparezcan | [x] | lint + test + build verdes |
| 1 | NOM-001 | Registrar el alcance en `docs/DECISIONES.md` (CRUD sin borrado; todas las operaciones por `id`; toggle = `Update`) | [x] | ADR con contexto/decisión/consecuencias |
| 1 | BE-004a | Actualizar `docs/CONTRATOS-BACKEND.md` §7 con `{ name, code }`, `getById`, `activate`/`deactivate` y estado **supuesto** | [x] | Endpoints y casing documentados |
| 2 | NOM-011 | `CountryRepository`: `getById`, `create({name,code})`, `update(id,{name,code})`, `activate(id)`, `deactivate(id)` | [x] | Spec de URLs/verbo/payload |
| 2 | NOM-012 | `CountriesListStore`: `withServerTableWrites` + `setActive()` no optimista (aplica al confirmar el backend) y guard por `id` en vuelo con `withPendingKeys` | [x] | Spec de éxito, en vuelo, error y doble toggle |
| 0 | GATE-REC | Reconciliar la implementación manual de Países con las features (ADR-012, specs y contratos) | [x] | Gates verdes 273/273 |
| 2 | NOM-002 | `country-dialog` única para alta/edición (nombre + código, §8, trim, `saving`, notificaciones) | [x] | Spec R1–R4 y create vs update |
| 2 | NOM-003/004 | Reemplazar `CountryDetails` roto por `country-detail-dialog` con `rxResource`, skeleton y reintento | [x] | Spec loading/éxito/error |
| 2 | NOM-005 | Toggle one-way en la tabla, sin `ngModel` mutando la entidad, `pi-eye`, copy "Código"/"países"/"Nuevo País" | [x] | Spec de tabla |
| 2 | NOM-006 | `CountriesPage`: diálogos por `modalMode`, permisos `Create`/`Read`/`Update`, `handlePageChange` | [x] | Spec de wiring y permisos |
| 2 | NOM-009/010 | Ruta `paises` + redirect desde `países`; wildcard a `/notfound` | [x] | Spec de navegación |
| 2 | SEC-001/002 | Menú: una sola entrada "Países" bajo Configuración > Nomencladores; renombrar la hoja de Seguridad `Configuración` → `Parámetros del sistema` | [x] | Menú sin duplicados |
| 3 | NOM-008 | Completar specs con valor (repositorio, store, diálogos, tabla, página, ruta) | [x] | Casos de loading/error/búsqueda/paginación/escritura |
| 3 | DOC-013 | Actualizar `ESTADO`, `tareas-pendientes` y este archivo al cierre | [x] | Sección de gates con resultado real |

## En curso

- Nada. Países cerrado y reconciliado; pendientes de higiene git y verificación de contratos.

## Hecho hoy (2026-10-27)

- **Reconciliación de la implementación manual:** se evaluó el CRUD manual y los cambios en `core/store/features`; se decidió con el usuario: `activate` por `id`, `load()` sin argumentos, eliminar `save()` y mantener `withPendingKeys` **no optimista**.
- `CountryRepository.activate(id)` / `deactivate(id)` ajustados a la decisión final; specs del repo actualizados (body `{}` de `requestResponse`).
- Features: `with-server-table` sin `reload` comentado; `with-server-table-writes` con acciones opcionales documentadas + test de acción ausente; spec nuevo de `withPendingKeys`.
- Store de Países: sin `save()` muerto; `setActive` no optimista (actualiza al confirmar el backend); guard de doble clic también en la página (sin notificación falsa).
- Specs actualizados: `with-server-table.feature.spec`, `countries-list.store.spec`, `country-table.spec` (`pendingCodes`), `country-repository.spec`.
- Limpieza: `console.log` fuera de `app.menu.ts`, comentario `// DESPUÉS` fuera de `country-table.ts`.
- Gates: lint 0 · **273/273 (52 archivos)** · build OK (warning de presupuesto 1.09 MB).

## Bloqueos

- **Contrato de activación sin verificar** (BE-004): se implementa según la referencia y se marca como supuesto en `CONTRATOS-BACKEND`.
- **Recurso RBAC `Nomenclators` sin verificar** (SEC-005).
- **Git:** índice desincronizado (stale en `country-repository`, store vacío staged, `country-details` AD) y 15 commits sin push. No commitear sin pedido explícito.

## Handoff (siguiente sesión)

1. Leer `AGENTS.md` → `ESTADO` → `MEMORIA` → este archivo → `tareas-pendientes` → `PREFERENCIAS`.
2. Correr los gates para confirmar el punto de partida:
   ```powershell
   pnpm exec ng lint
   pnpm exec ng test --watch=false
   pnpm exec ng build
   ```
3. **Higiene git:** revisar `git diff --cached` (el índice tiene snapshots viejos de Países), re-stagear por paths explícitos los archivos de esta tanda y resolver logs trackeados/lockfiles.
4. **Verificación contra backend:** BE-004 (activate/deactivate con `{}`), SEC-005, y pendientes de auditorías/usuarios.
5. No commitear ni pushear hasta que el usuario lo pida; si lo pide, `git add -- <paths>` explícitos.

## Notas

- Antes de cualquier commit: `git add -- <paths>` explícitos; nunca `git add .`.
- `rxResource.value()` lanza en error: leer `error()` primero.
- Specs de guards requieren stub de `ConfigService`; efectos zoneless con `TestBed.flushEffects()`.
- No tocar Angular 21 ni introducir `any` ni comentarios nuevos.
- `load()` de `withServerTable` NO recibe `QueryParams`: lee `store.query()`; para probar queries distintas usar `setPage/setSearch` antes de `load()`.
- `withPendingKeys` es un guard de UX por fila; el resto de la verdad la tiene el backend. `setActive` no es optimista.
