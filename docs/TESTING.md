# Testing — Sakai NG

> **Última actualización: 2026-11-02.**
> Estrategia, comandos, patrones y calidad mínima de las pruebas. Los gates son obligatorios antes de cerrar una tarea.

---

## 1. Stack y comandos

- **Runner:** Vitest 4 + jsdom, vía `@angular/build:unit-test` (`runnerConfig: vitest-base.config.ts`).
- **Comando único de CI/local:**

```powershell
pnpm exec ng test --watch=false
```

- **Gates completos antes de cerrar:**

```powershell
pnpm exec ng lint
pnpm exec ng test --watch=false
pnpm exec ng build
```

- **Estado de referencia:** último verde conocido **429/429 (79 archivos)** el **2026-11-02**. El entorno carga `src/test-setup.ts` (definido en `vitest-base.config.ts`) para polyfillar `localStorage`/`sessionStorage`, que jsdom no expone sobre Node 26.

## 2. Pirámide y qué probar

| Nivel | Qué cubre | Ejemplos |
|---|---|---|
| Unitario puro | utils, mappers, validadores, reglas de dominio | `token-expiry`, `custom-validators`, `audit-mapper` |
| Store/feature | transiciones de estado, stale responses, coordinadores | `withServerTable`, `SessionStore`, `RoleListStore` |
| Repositorio | URL, verbo, payload y propagación de errores | `RoleRepository`, `AuditRepository`, `UserRepository` |
| Componente | inputs/outputs, estados de carga/error/vacío, validación | `user-dialog`, `audit-filters`, `country-table` |
| Integración de rutas | guards + navegación + configuración | `navigation.integration.spec.ts` |

**No** hace falta un e2e de navegador para cada pantalla; sí un test de navegación para rutas críticas y un piloto end-to-end manual con backend (Fase 4).

## 3. Patrones obligatorios

### ConfigService

Los guards y servicios que usan `urlWith` necesitan config. En specs, stubear:

```ts
{ provide: ConfigService, useValue: { whenLoaded: () => Promise.resolve(), urlWith: (p: string) => `http://test${p}` } }
```

Sin el stub, el `load()` real intenta leer `/assets/config.*` y contamina el test.

### HTTP

Usar `HttpTestingController` y `firstValueFrom`:

```ts
const value = await firstValueFrom(service.list(query));
httpMock.expectOne((req) => req.url.endsWith('/api/roles'));
```

Cuando falta config, el throw es **síncrono** al construir el Observable:

```ts
expect(() => service.getAll('x')).toThrow();
```

Para carreras de requests async, esperar el dispatch antes de `expectOne`:

```ts
await vi.waitFor(() => httpMock.expectOne(url));
```

### Effects zoneless

Los effects de servicios root no corren solos en specs:

```ts
TestBed.flushEffects();
```

Para crear servicios fuera de DI: `TestBed.runInInjectionContext(() => new LayoutService())`.

### Signals y recursos

- `rxResource.value()` **lanza** en estado de error. Leer `error()` primero:
  ```ts
  computed(() => (r.error() ? null : (r.value() ?? null)))
  ```
- No leer `value()` sin guard en templates ni specs.

### Mocks de router

```ts
vi.fn<Router['navigate']>();
```

## 4. Calidad mínima de un spec

Un spec con valor:

- Nombra el comportamiento, no la implementación (`emits page change when pageSizeChanges`).
- Cubre al menos un camino feliz y un borde (vacío, error, stale response, permiso denegado).
- No depende del orden de otros tests; limpia `HttpTestingController.verify()`.
- No usa `should create` como única aserción.
- Si prueba un formulario, cubre validación y `markAllAsTouched()`.

**Anti-patrones:** boilerplate de `TestBed` sin aserciones, `setTimeout` adivinados, `vi.waitFor` para effects zoneless, mocks que devuelven `any`.

## 5. Qué se considera "verificado"

- `lint` en 0.
- Suite completa en verde (`--watch=false`).
- Build de producción OK.
- Si el cambio toca un contrato de backend, la verificación real quedó anotada en `docs/CONTRATOS-BACKEND.md`.
- Si el cambio toca una pantalla, el flujo manual mínimo (listar, buscar, paginar, abrir detalle, error) se probó.

## 6. Cobertura

No hay umbral obligatorio. Prioridad:

1. `core/` (utils, guards, stores, servicios de auth/HTTP).
2. `core/store/features/` (comportamiento reutilizable).
3. Mappers y validadores de dominio.
4. Componentes con lógica (diálogos, filtros), no wrappers triviales.

La cobertura alta sin aserciones útiles no cuenta.

## 7. Tests frágiles conocidos

- **Carreras de requests** en specs con login/logout: esperar el dispatch (`vi.waitFor` + `expectOne`).
- **Effects zoneless:** usar `TestBed.flushEffects()`, no timers.
- **`ConfigService` real:** stubbear siempre en guards/navegación.
- **`rxResource` en error:** no leer `value()`.
- **Restauración de sesión:** el 401 con interceptor dispara refresh single-flight; los specs de restauración se parten en dos describes (con y sin interceptor).
- **Inputs requeridos:** en componentes con `input.required`, setearlos antes de ejecutar detección de cambios; un `should create` que no lo hace no prueba nada.
- **`localStorage` en Node 26 + jsdom:** Node define `globalThis.localStorage` como acceso experimental no disponible y jsdom no lo pisa; `src/test-setup.ts` instala un `Storage` en memoria. Si un spec necesita limpiar, usa `localStorage.clear()` / `sessionStorage.clear()` en `beforeEach`.

## 8. Backend y dobles

- Preferir `HttpTestingController` sobre mocks manuales de `HttpClient`.
- Para repositorios, verificar URL, método y body exactos (incluido casing).
- Para stores, inyectar un repository stub con Observables controlados (`of`, `throwError`, `Subject`) y probar stale responses con `switchMap`.
- No golpear el backend real en tests automáticos; la verificación real es manual y se documenta.

## 9. Definition of Done de testing

- [ ] Spec con valor para el cambio (o justificación de por qué no aplica).
- [ ] `lint`, `test --watch=false` y `build` verdes.
- [ ] Sin `any`, sin waits adivinados, sin dependencia de orden.
- [ ] Contratos de backend verificados anotados en `docs/CONTRATOS-BACKEND.md`.
