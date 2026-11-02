# Decisiones del proyecto — Sakai NG

> **Última actualización: 2026-10-23.**
> Registro ADR-ligero. Solo se agrega; si una decisión se reemplaza, se marca como `reemplazada` y se enlaza la nueva. No borrar el histórico.

---

## Plantilla

```markdown
## ADR-XXX — Título

- **Fecha:** YYYY-MM-DD
- **Estado:** vigente | reemplazada | propuesta
- **Contexto:** qué problema o fuerza motivó la decisión
- **Decisión:** qué se decidió
- **Consecuencias:** qué facilita, qué cuesta y qué queda prohibido
- **Enlaces:** archivos, commits, documentos
```

## Índice

| ID | Decisión | Fecha | Estado |
|---|---|---|---|
| ADR-001 | Angular 21 fijado; no actualizar a 22 | 2026-09-22 | vigente |
| ADR-002 | `@ngrx/signals` oficial + features propias; sin NgRx Traits | 2026-09-22 | vigente |
| ADR-003 | `GenericHttpService` devuelve `Observable` | 2026-09-24 | vigente |
| ADR-004 | Contrato de auth: vidas en minutos, refresh sin rotación, fingerprint persistente | 2026-09-22 | vigente |
| ADR-005 | Stores de sesión puros; stores de pantalla con IO | 2026-09-22 | vigente |
| ADR-006 | `withServerTable` (lectura) + `withServerTableWrites` (escritura); sin page cache | 2026-10-07 | vigente |
| ADR-007 | RBAC unificado sobre `SessionStore` | 2026-09-24 | vigente |
| ADR-008 | Estándar de validación §8 + override global del borde rojo | 2026-10-05 | vigente |
| ADR-009 | `CorporatePreset` como fuente del color/radios; login derivado del primary | 2026-10-01 | vigente |
| ADR-010 | `SessionReadyService` espera config; restauración fail-open | 2026-10-09 | vigente |
| ADR-011 | Memoria documental en repo como fuente de verdad | 2026-10-23 | vigente |
| ADR-012 | Países: CRUD sin borrado físico; todas las operaciones por `id` | 2026-10-23 | vigente |
| ADR-013 | Regla de reset de página: setters resetean `Page` a 1; `patchQuery`/`mergeQuery` nunca | 2026-10-27 | vigente |

---

## ADR-001 — Angular 21 fijado; no actualizar a 22

- **Fecha:** 2026-09-22
- **Estado:** vigente
- **Contexto:** PrimeNG 22 incorporó validación de licencia PrimeUI por red y muestra un banner de licencia inválida; no hay presupuesto de licencia.
- **Decisión:** quedarse en Angular 21 y PrimeNG 21. No cambiar el builder ni el major sin una decisión explícita.
- **Consecuencias:** estabilidad y cero coste de licencia; se renuncia a features de Angular 22. Actualizar requiere presupuesto y un ADR nuevo.
- **Enlaces:** `package.json`, `ESTADO-DEL-PROYECTO.md` §2, `AGENTS.md` §5.

## ADR-002 — `@ngrx/signals` oficial + features propias; sin NgRx Traits

- **Fecha:** 2026-09-22
- **Estado:** vigente
- **Contexto:** se necesita estado signal-nativo, composición y testabilidad; el equipo quiere ser dueño de la lógica de paginación/filtros.
- **Decisión:** usar el núcleo oficial `@ngrx/signals` (`signalStore`, `withState`, `withComputed`, `withMethods`, `withHooks`) y construir features propias. No adoptar NgRx Traits.
- **Consecuencias:** control total y menos dependencias; más código propio que mantener. Las features viven en `core/store/features/`.
- **Enlaces:** `core/store/`, `ESTADO-DEL-PROYECTO.md` §3.

## ADR-003 — `GenericHttpService` devuelve `Observable`

- **Fecha:** 2026-09-24
- **Estado:** vigente
- **Contexto:** los stores de pantalla necesitan cancelar requests en vuelo (`switchMap`/`rxMethod`).
- **Decisión:** los métodos de `GenericHttpService` devuelven `Observable`, no `Promise`. Los repositorios de features lo propagan; los specs levantan el valor con `firstValueFrom`.
- **Consecuencias:** cancelación real y composición RxJS; los consumidores deben suscribirse o convertir. El throw por config faltante es síncrono (se evalúa `url()` al construir el Observable).
- **Enlaces:** `core/services/generic-http.service.ts`, `ESTADO-DEL-PROYECTO.md` §2.

## ADR-004 — Contrato de auth

- **Fecha:** 2026-09-22
- **Estado:** vigente
- **Contexto:** el backend .NET define el contrato de tokens; una implementación inicial asumía segundos y generaba un fingerprint por intento, lo que disparaba la regla de sesión única.
- **Decisión:**
  - `expiresIn` y `refreshTokenExpiresIn` están en **minutos** (el body es la fuente de verdad, no el `exp` del JWT).
  - El refresh **no rota**; se trackea la expiración del refresh y se hace short-circuit.
  - El fingerprint es **persistente** (UUID generado una vez y reutilizado) y solo viaja en el login (revisado 2026-10-23).
  - Las rutas públicas se declaran con `resource: 'Public'` o sin `resource`.
  - La identidad y los permisos se leen siempre de la API.
- **Consecuencias:** una sola conversión de unidades (`core/utils/token-expiry.ts`); el login repetido no simula un dispositivo nuevo. Casing de logout/refresh pendiente de verificación final.
- **Enlaces:** `modules/auth/`, `core/services/token-auth.service.ts`, `docs/CONTRATOS-BACKEND.md`.

## ADR-005 — Stores de sesión puros; stores de pantalla con IO

- **Fecha:** 2026-09-22
- **Estado:** vigente
- **Contexto:** mezclar navegación/IO en el estado global hace el store difícil de testear.
- **Decisión:** `SessionStore` solo recibe escrituras puras; los use-cases orquestan IO y navegación. Los stores de pantalla sí hacen sus fetches en `withMethods` porque poseen el ciclo de vida de ese estado.
- **Consecuencias:** separación clara y testabilidad; los use-cases concentran la orquestación. La navegación nunca entra al store.
- **Enlaces:** `core/store/session.store.ts`, `modules/auth/application/`.

## ADR-006 — `withServerTable` + `withServerTableWrites`; sin page cache

- **Fecha:** 2026-10-07
- **Estado:** vigente
- **Contexto:** roles, usuarios y auditorías repetían la misma composición de listado; un único feature monolítico era demasiado.
- **Decisión:** separar lectura (`withServerTable`: query, entidades, loading/meta, stale responses, selección, coordinadores) de escritura (`withServerTableWrites`: `saving`, create/update/delete + recarga). Una pantalla read-only nunca compone writes. Se descartó el page cache.
- **Consecuencias:** menos duplicación y límites claros; hay dependencia de orden entre features. La persistencia de filtros cubre el caso real de caché.
- **Enlaces:** `core/store/features/with-server-table*.feature.ts`, `ESTADO-DEL-PROYECTO.md` §5.

## ADR-007 — RBAC unificado sobre `SessionStore`

- **Fecha:** 2026-09-24
- **Estado:** vigente
- **Contexto:** existían imports fantasma y un `PermissionService` paralelo.
- **Decisión:** una sola fuente de permisos: `SessionStore.hasPermission`. El guard `permission` y la directiva `*appHasPermission` se apoyan en él. No recrear `PermissionService`.
- **Consecuencias:** menos estados duplicados y una sola semántica de permisos; los componentes no leen roles directamente.
- **Enlaces:** `core/store/session.store.ts`, `core/guards/permission.guard.ts`, `shared/directives/has-permission.directive.ts`.

## ADR-008 — Estándar de validación §8 + override global del borde rojo

- **Fecha:** 2026-10-05
- **Estado:** vigente
- **Contexto:** PrimeNG 21 no estiliza `p-invalid`/`p-error` y su CSS de foco pisa el borde rojo.
- **Decisión:** usar `ng-invalid ng-dirty` + Tailwind para el estado y los mensajes; `markAllAsTouched()` al guardar inválido; override global en `styles.scss` con prefijo `html` para ganar especificidad sin `!important`.
- **Consecuencias:** consistencia visual y menos CSS por pantalla; cualquier formulario nuevo debe seguir las 4 reglas del estándar.
- **Enlaces:** `docs/estandar-validacion-formularios.md`, `ESTADO-DEL-PROYECTO.md` §7-§8.

## ADR-009 — `CorporatePreset` y tema derivado del primary

- **Fecha:** 2026-10-01
- **Estado:** vigente
- **Contexto:** se necesitaba una identidad corporativa única y dark mode consistente.
- **Decisión:** `CorporatePreset` define radios y `semantic.primary`; el color de marca sale de `--primary-color`. El login y los acentos dark derivan de ese token, sin hex fijos.
- **Consecuencias:** cambiar el primary retiñe la app; introducir hex nuevos rompe la coherencia y requiere justificación.
- **Enlaces:** `theme/corporate.preset.ts`, `app.config.ts`, `ESTADO-DEL-PROYECTO.md` §9.

## ADR-010 — `SessionReadyService` espera config; restauración fail-open

- **Fecha:** 2026-10-09
- **Estado:** vigente
- **Contexto:** el initializer de config y la navegación inicial corren en paralelo; un fallo de red deslogueaba al usuario.
- **Decisión:** `SessionReadyService.whenReady()` espera `ConfigService.whenLoaded()` (single-flight). `RestoreSessionUseCase` solo limpia la sesión ante **401/418**; errores transitorios (red, 5xx, config) conservan tokens y store.
- **Consecuencias:** menos falsos logouts y un solo dueño de la restauración; los specs deben stubear `ConfigService`.
- **Enlaces:** `core/guards/session-ready.service.ts`, `modules/auth/application/restore-session.use-case.ts`, `ESTADO-DEL-PROYECTO.md` §7.

## ADR-012 — Países: CRUD sin borrado físico; todas las operaciones por `id`

- **Fecha:** 2026-10-23
- **Estado:** vigente
- **Contexto:** el alcance de Nomencladores/Países quedó confirmado: crear, editar, ver detalle y activar/desactivar. La pantalla usa `id` para todas las operaciones: activación, desactivación, edición y detalle. El toggle de la tabla estaba cableado con `[(ngModel)]` mutando la entidad y sin llamada al backend.
- **Decisión:**
  - No existe eliminación física: la baja de un país es su desactivación.
  - Detalle por `GET /api/country/{id}` con `rxResource` (skeleton + reintento).
  - Activación `PUT /api/country/activate/{id}`; desactivación `DELETE /api/country/{id}` (con body `{}` para forzar JSON).
  - `CountryRepository` expone `create({ name, code })` y `update(id, { name, code })`; el store compone `withServerTableWrites` para `saving` y recarga.
  - `setActive` **no es optimista**: no toca la entidad hasta que el backend confirma; entonces aplica el nuevo `active` y libera la clave. Un segundo toggle del mismo `id` se ignora mientras el primero sigue en vuelo (`withPendingKeys`).
  - La tabla emite `toggleActive({ country, active })` con `[ngModel]` unidireccional; no muta la entidad.
  - RBAC sobre `SessionStore`: alta `Create`, edición y toggle `Update`, detalle `Read`, recurso `Nomenclators`.
- **Consecuencias:** una sola pantalla cubre el ciclo de vida sin borrar datos; el estado mostrado siempre proviene de una respuesta exitosa del backend y no hay rollback optimista que mantener. El guard de `pendingKeys` es solo de UX (evita dobles clics); no sustituye la idempotencia/concurrencia del servidor. El contrato de activación/desactivación queda **supuesto** hasta verificarlo contra el backend (BE-004).
- **Enlaces:** `modules/nomenclators/countries/`, `docs/CONTRATOS-BACKEND.md` §7, `docs/PLAN-DIARIO.md`.

## ADR-013 — Regla de reset de página: setters resetean `Page` a 1; `patchQuery`/`mergeQuery` nunca

- **Fecha:** 2026-10-27
- **Estado:** vigente
- **Contexto:** el `query` del store recibe cambios de varias fuentes (búsqueda, filtros, orden, persistencia, futuros query params de URL); con `load()` sin argumentos, el query es la única fuente de verdad y una página inconsistente rompe paginación/filtros.
- **Decisión:** todo setter que cambia el conjunto de resultados (`setSearch`, `setFilters`, `setSort`, `setSortAndReload`, `applyFilters`/`clearFilters`) resetea `Page` a 1; `patchQuery`/`mergeQuery` (y el coordinador `applyQueryAndReload`) nunca la resetean.
- **Consecuencias:** los coordinadores `*AndReload` heredan la regla; los parches quirúrgicos (URL, fuentes externas) conservan la página pedida. Las escrituras (create/update/delete) no tocan el query.
- **Enlaces:** `core/store/features/with-query.feature.ts`, `core/store/features/with-server-table.feature.ts`, `core/interfaces/query-params.ts`.

## ADR-011 — Memoria documental en el repo como fuente de verdad

- **Fecha:** 2026-10-23
- **Estado:** vigente
- **Contexto:** el contexto estaba repartido entre documentos, logs, anexos y memoria de sesión; cualquier agente redescubría lo mismo.
- **Decisión:** crear una memoria documental en el repo con una sola fuente de verdad por tipo: `AGENTS.md`, `ESTADO`, `MEMORIA`, `PLAN-DIARIO`, `tareas-pendientes`, `PREFERENCIAS`, `DECISIONES`, `CONTRATOS-BACKEND` y `TESTING`. Los anexos históricos no son fuente de verdad.
- **Consecuencias:** onboarding más rápido y continuidad entre sesiones; exige disciplina de actualización al cierre. La documentación se actualiza en el mismo flujo que el código.
- **Enlaces:** `AGENTS.md`, `ESTADO-DEL-PROYECTO.md` §10, `docs/MEMORIA-PROYECTO.md`.
