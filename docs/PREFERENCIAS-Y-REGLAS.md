# Preferencias y reglas del proyecto — Sakai NG

> **Última actualización: 2026-10-23.**
> Reglas estables de trabajo. Si una regla cambia, se registra aquí y, si es una decisión de arquitectura, también en `docs/DECISIONES.md`.

---

## 1. Comunicación

- **Idioma:** español, tanto en documentos como en respuestas y mensajes de UI.
- **Explicar antes de aplicar:** los cambios relevantes se comunican y se acuerdan antes de escribirlos; con git, el diff es la narrativa.
- **No asumir:** si hay ambigüedad de alcance, producto o contrato, preguntar antes de implementar.
- **No commitear ni pushear** salvo que el usuario lo pida explícitamente.
- **Concisión:** respuestas cortas y directas; detalle solo cuando se pide o cuando el riesgo lo exige.

## 2. Código

- **Sin comentarios** salvo petición explícita. El código debe explicarse por nombres y estructura.
- **Sin `any`.** TypeScript estricto; usar tipos del dominio, uniones y genéricos.
- **`inject()`** para dependencias; evitar constructores con parámetros cuando no aporten.
- **Un solo escritor por campo de estado**; derivados con `computed`; efectos dentro de las features del store.
- **Nombres:** código en inglés, UI y documentos en español. Selectores de componentes con prefijo `app-`.
- **Imports:** usar el alias `@/` para rutas internas; evitar `../../..` profundos.
- **Archivos:** `kebab-case`; componentes Angular con nombre `*.component.ts` o el patrón ya establecido en el módulo.
- **Formato:** Prettier; no reformatear archivos ajenos al cambio.

## 3. Angular y PrimeNG

- **Angular 21 fijado.** No actualizar a 22 ni cambiar builders sin decisión registrada (PrimeNG 22 exige licencia PrimeUI).
- **Zoneless** (`provideZonelessChangeDetection`); usar signals y `OnPush`/`Eager` según corresponda.
- **PrimeNG 21:** no estiliza `p-invalid` ni `p-error`; el estado inválido se declara con `ng-invalid ng-dirty` + Tailwind.
- **Tema:** color de marca y radios salen de `CorporatePreset` / `--primary-color`. No introducir hex fijos nuevos.
- **Iconos:** PrimeIcons (`pi pi-*`); evitar SVG inline nuevo si existe un componente compartido.
- **Formularios:** reactivos, tipados con `NonNullableFormBuilder`; sin `ngModel` salvo casos justificados.

## 4. Validación de formularios

Fuente completa: `docs/estandar-validacion-formularios.md` y `ESTADO-DEL-PROYECTO.md` §8.

1. Clase de estado: `[ngClass]="{ 'ng-invalid ng-dirty': <c>.invalid && (<c>.dirty || <c>.touched) }"`.
2. Mensaje: `<small class="block mt-1 text-red-500 dark:text-red-400">`; nunca `p-error`.
3. Al guardar inválido: `form.markAllAsTouched()` y no persistir.
4. Botón: `[disabled]="saving() || !dirty()"`.

El override del borde rojo con foco es global en `styles.scss`; no duplicarlo por pantalla.

## 5. Testing

- **Specs con valor:** nada de `should create` como única prueba.
- **Gates:** `pnpm exec ng lint`, `pnpm exec ng test --watch=false`, `pnpm exec ng build`.
- **Mocks obligatorios:** `ConfigService` (`whenLoaded` + `urlWith`), `HttpTestingController` para HTTP, `TestBed.flushEffects()` en zoneless.
- **Observables:** los repositorios devuelven `Observable`; en specs usar `firstValueFrom` y `expect(() => service.getAll(...)).toThrow()` cuando falte config.
- **No forzar tests:** si un test cuesta, cuestionar la implementación antes de rodearla.
- Detalle y patrones: `docs/TESTING.md`.

## 6. Git

- **Ramas:** `feat/*`, `fix/*`, `docs/*`; PR a `main` al cerrar una fase.
- **Conventional Commits:** `feat(scope):`, `fix(scope):`, `docs(scope):`, `refactor(scope):`, `test(scope):`, `chore(scope):`.
- **Nunca `git add .`.** Usar paths explícitos:
  ```powershell
  git add -- <paths>
  git commit -m "tipo(scope): mensaje" -- <paths>
  git show --stat HEAD
  ```
- **Una unidad lógica por commit.** No mezclar refactor, feature y docs salvo que sean inseparables.
- **No commitear:** logs, `dist/`, `node_modules/`, tokens, `.env`, artefactos locales.
- **Push:** al cerrar cada unidad o al final del día; no acumular commits locales.
- **Antes de commitear:** revisar `git status`, `git diff` y el índice (`AM`/`RM` suelen indicar snapshots viejos).

## 7. Seguridad

- Identidad y permisos **siempre** desde la API; nunca decodificar el JWT.
- Los tokens solo los toca `TokenAuthService`; no leerlos en componentes.
- Nunca commitear secretos, claves, tokens ni `.env`.
- Errores técnicos (status, URL, stack) solo en consola; al usuario, mensajes amigables.

## 8. Backend y referencia

- El contrato de paginación es .NET: `QueryParams` (`Pag.Page`, `Search.SearchText`, `Sort[i]`, `Filter`) y `PaginatedResponse` (`objects` + `meta`).
- `expiresIn` y `refreshTokenExpiresIn` están en **minutos** (confirmado por backend).
- Logout: `POST /api/auth/logout` con `{ refreshToken }`; refresh usa `{ RefreshToken }` (casing pendiente de verificación final).
- Devueltos es referencia de dominio, no código a copiar. Su deuda (crypto-js, `any`, widgets demo) no se porta.
- Todo contrato nuevo o verificado se anota en `docs/CONTRATOS-BACKEND.md`.

## 9. Documentación

- Una sola fuente de verdad por tipo de información (ver `ESTADO` §10).
- Cada documento lleva `Última actualización` y, cuando aplique, "actualizar cuando".
- Los documentos se enlazan, no se copian. Si hay duplicación, se elimina en el siguiente cambio.
- Al cerrar una tarea se actualizan `ESTADO`, `tareas-pendientes` y `PLAN-DIARIO`; las decisiones van a `DECISIONES`.
- Los anexos históricos (`docs/anexos/`) no son fuente de verdad y no se actualizan.

## 10. Definition of Done

- [ ] Compila y cumple los invariantes.
- [ ] Tests con valor y gates verdes.
- [ ] Documentos afectados actualizados.
- [ ] Commit con paths explícitos y mensaje Conventional Commits.
- [ ] Si se verificó contra backend, anotado en `docs/CONTRATOS-BACKEND.md`.
