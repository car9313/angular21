# AGENTS.md — Sakai NG

> Punto de entrada para cualquier agente o persona que trabaje en este repo.
> **Última actualización: 2026-10-23.**
> Este archivo es corto y estable a propósito: el detalle vive enlazado abajo.

---

## 1. Qué es este proyecto

Aplicación **Angular 21** con **PrimeNG 21**, **Tailwind 4**, **@ngrx/signals** y **Vitest 4**, reconstruida con mejores prácticas a partir del dominio de la app de referencia "Devueltos". El objetivo es un cascarón de seguridad + layout premium, escalable y mantenible.

**Regla de oro:** "Devueltos" es **referencia de dominio**, no código a copiar. Se extrae conocimiento (contratos .NET, RBAC, flujos de auth, edge cases), no su deuda técnica.

## 2. Orden de lectura obligatorio

Al iniciar cualquier sesión, leer en este orden:

1. `AGENTS.md` (este archivo).

## 3. Snapshot actual (2026-10-23)

- Rama de trabajo: `feat/core-foundation`.
- Stack fijado: **Angular 21**. **NO subir a Angular 22** (PrimeNG 22 valida licencia PrimeUI por red).
- Gestor de paquetes: **pnpm 10.34.5**; usar `pnpm exec ng ...`.
- Última verificación real de gates: **2026-10-27** (lint 0 · 273/273 · build OK con warning de presupuesto).
- Trabajo en curso: **Nomencladores/Países** (cerrado, contrato pendiente de verificar en backend) + pulido de login/topbar/panel.
- Hay trabajo sin commitear y **15 commits sin push**; ver `ESTADO-DEL-PROYECTO.md` §11 antes de tocar git.

## 4. Comandos del proyecto

```powershell
pnpm install                     # dependencias
pnpm exec ng serve               # dev en http://localhost:1234
pnpm exec ng test --watch=false  # suite completa
pnpm exec ng lint                # ESLint flat
pnpm exec ng build               # build de producción
pnpm exec ng build --configuration development
```


## 5. Invariantes (no negociables)

- **Angular 21 fijado.** No actualizar a 22 ni cambiar el builder sin decisión registrada.
- **No `any`.** TypeScript estricto; preferir tipos del dominio.
- **No comentarios** en el código salvo que se pidan explícitamente.
- **Un solo escritor por campo de estado**; derivados con `computed`; efectos en features del store.
- **HTTP de features:** `GenericHttpService` devuelve `Observable`; el contrato de paginación es `QueryParams` / `PaginatedResponse`.
- **Auth:** identidad y permisos **siempre** desde la API, nunca decodificando el JWT. Los tokens solo los toca `TokenAuthService`.
- **RBAC:** `SessionStore.hasPermission` + guard `permission` + directiva `*appHasPermission`.
- **Validación:** seguir el estándar §8 de `ESTADO-DEL-PROYECTO.md` y `docs/estandar-validacion-formularios.md`.
- **Tema:** el color de marca y los radios salen de `CorporatePreset` / `--primary-color`; no introducir hex fijos nuevos.
- **Secretos:** nunca commitear tokens, claves ni `.env`.

## 6. Protocolo de sesión

### Inicio

1. Leer los documentos del punto 2.



