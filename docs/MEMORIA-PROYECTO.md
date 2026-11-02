# Memoria del proyecto — Sakai NG

> **Última actualización: 2026-10-23.**
> Documento de orientación para cualquier persona o agente. No sustituye a `ESTADO-DEL-PROYECTO.md` (detalle técnico) ni a `docs/tareas-pendientes.md` (acciones). Resume, enlaza y explica el "por qué".

---

## 1. Qué es

Cascarón de seguridad y layout para una aplicación empresarial, reconstruido en **Angular 21** a partir del dominio de la app de referencia **"Devueltos"**. El proyecto busca una base premium, tipada, testeable y escalable para que las pantallas de negocio se construyan sobre un patrón único.

**No es** un port de Devueltos. Devueltos es una referencia de dominio (contratos .NET, RBAC, auth, edge cases); su deuda técnica no se copia.

## 2. Stack y restricciones

| Área | Decisión |
|---|---|
| Framework | Angular 21 + PrimeNG 21 + `@primeuix/themes` 2 |
| Estilos | Tailwind 4 + tema `CorporatePreset` |
| Estado | `@ngrx/signals` + features propias |
| Build | `@angular/build` (esbuild/Vite) |
| HTTP | `HttpClient` + `GenericHttpService` (devuelve `Observable`) |
| Testing | Vitest 4 + jsdom (`@angular/build:unit-test`) |
| Paquetes | pnpm 10.34.5 |
| Auth | Web Crypto AES-GCM, refresh single-flight, identidad desde API |

**Prohibido:** subir a Angular 22 (licencia PrimeUI), `any`, comentarios no pedidos, hex de marca fuera del preset, decodificar el JWT para obtener identidad/permisos.

## 3. Arquitectura en una página

- **4 capas de estado:** `signal()` local → store por pantalla → `SessionStore` global → `httpResource` para catálogos.
- **Dirección de dependencias:** `component → store → repository/API`. Nunca al revés.
- **Reglas:** derivado = `computed`; un solo escritor por campo; efectos en features del store; los stores no se importan entre sí; solo `TokenAuthService` toca el storage de tokens.
- **Auth:** use-cases orquestan IO; `SessionStore` solo recibe escrituras puras; la navegación no entra al store.
- **Listados:** `withServerTable` (lectura: query, entidades, loading/meta, stale responses, selección, coordinadores) + `withServerTableWrites` (solo CRUD). Una pantalla read-only nunca compone writes.
- **Carpetas:** `core/` transversal · `modules/<feature>/{domain,application,infrastructure,presentation}` · `shared/` UI reutilizable. El bootstrap vive en `src/app/` y `main.ts` es la única entrada.

## 4. Mapa rápido de carpetas

```text
src/app/
  core/
    constants/        menú, acciones, recursos RBAC, traducción ES
    guards/           auth, guest, permission, sesión lista
    helpers/          paginación, fechas, tabla lazy
    interfaces/       QueryParams, PaginatedResponse, columnas, acciones
    services/         config, HTTP genérico, tokens, storage, crypto, notificaciones
    store/            SessionStore + features (withServerTable, withModal...)
    utils/            validadores, expiración de tokens, errores HTTP
  layout/             topbar, menú, configurador, layout service
  modules/
    auth/             login/restauración de sesión
    security/         roles, usuarios, auditorías, configuración
    nomenclators/     países (en curso)
  pages/              login, panel principal, auth routes
  shared/             tabla, toolbar, filtros, selects, diálogos, directivas
  theme/              CorporatePreset
```

## 5. Foco actual (2026-10-23)

1. **Nomencladores/Países** está a medio construir: el listado funciona; faltan CRUD, detalle y decidir permisos. `CountryDetails` está roto y no referenciado.
2. **Pulido visual:** login, topbar y panel principal tienen hex fijos y código muerto que deben alinearse con el tema corporativo.
3. **Higiene:** árbol sucio, 15 commits sin push, logs trackeados y doble lockfile.
4. **Verificación:** gates sin correr desde el 2026-10-07 y contratos de backend pendientes.

Detalle accionable: `docs/tareas-pendientes.md`. Estado técnico: `ESTADO-DEL-PROYECTO.md` §0, §4, §11 y §12.

## 6. Qué leer según la tarea

| Tarea | Documentos |
|---|---|
| Orientarme por primera vez | Este archivo + `ESTADO` §0/§3/§4 |
| Implementar una pantalla | `ESTADO` §3, `docs/tareas-pendientes.md`, `docs/TESTING.md` |
| Tocar auth/RBAC | `ESTADO` §3 y §7, `docs/CONTRATOS-BACKEND.md`, `docs/DECISIONES.md` |
| Crear un formulario | `docs/estandar-validacion-formularios.md`, `ESTADO` §8 |
| Probar algo | `docs/TESTING.md`, `ESTADO` §7 |
| Commitear/pushear | `AGENTS.md` §8, `docs/PREFERENCIAS-Y-REGLAS.md` §Git |
| Entender una decisión | `docs/DECISIONES.md` |
| Ver un endpoint | `docs/CONTRATOS-BACKEND.md` |

## 7. Decisiones clave (índice)

El registro completo, con contexto y consecuencias, está en `docs/DECISIONES.md`. Resumen:

- Angular 21 fijado; no 22.
- `@ngrx/signals` oficial + features propias; sin NgRx Traits.
- `GenericHttpService` devuelve `Observable` (cancelación con `switchMap`).
- Auth: refresh sin rotación, vidas en **minutos**, fingerprint persistente, recurso público `Public`.
- Stores de sesión puros; stores de pantalla con fetch en `withMethods`.
- `withServerTable` (lectura) separado de `withServerTableWrites` (escritura); sin page cache.
- RBAC unificado sobre `SessionStore`; sin `PermissionService` paralelo.
- Validación §8 + override global del borde rojo con foco.
- Tema: `CorporatePreset`; el login deriva de `--primary-color`.
- Restauración de sesión fail-open (solo 401/418 limpian).

## 8. Contratos de backend (índice)

Detalle en `docs/CONTRATOS-BACKEND.md`. Módulos documentados: auth, usuarios, roles, auditorías, configuración y países. Cada endpoint lleva estado **verificado / pendiente / supuesto**; si no está verificado contra backend real, no se asume.

## 9. Deuda y riesgos conocidos

- `CountryDetails` roto y `AuditMapper` con tipo inconsistente (ambos fuera del grafo de compilación).
- `security.routes.ts` vacío; rutas `seguridad` repetidas.
- Menú con "Países" duplicado.
- Login con flags/estado muertos.
- `withServerTable` no resetea `meta` en error; `hasActiveFilters` duplicado.
- Logs trackeados y doble lockfile.
- Budget de bundle cerca del warning (1 MB).

## 10. Cómo se mantiene esta memoria

- **Inicio de sesión:** leer `AGENTS.md` → `ESTADO` → este archivo → `PLAN-DIARIO` → `tareas-pendientes` → `PREFERENCIAS`.
- **Durante:** actualizar `PLAN-DIARIO`; las decisiones van a `DECISIONES`, no aquí.
- **Cierre:** actualizar `ESTADO`, mover pendientes, dejar handoff y archivar el mes en `docs/bitacora/` (convención en su `README.md`).
- **Regla:** este documento no copia detalles; solo orienta y enlaza. Si algo cambia, se actualiza el documento dueño y aquí solo se ajusta el resumen.
