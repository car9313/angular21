# Estándar de validación de formularios — Sakai NG

> Aplica a **todo** formulario con validación (diálogos, páginas, futuras pantallas Fase 2.5+ / Fase 3).
> Documento vivo: última actualización 2026-10-05. Contexto y gotchas relacionadas en `ESTADO-DEL-PROYECTO.md` §7/§8.

---

## 1. Por qué existe este estándar

PrimeNG 21 **no estiliza** los estados de validación. En su CSS compilado hay **0 reglas** para `.p-invalid` de foco, `.p-error` y no hay regla que mantenga el borde de error cuando el campo tiene foco. Concretamente, PrimeNG **pisa** el color de error con el de foco en cuanto el input está enfocado:

```css
/* Inyectado en runtime por primeng-inputnumber.mjs / primeng-password.mjs */
p-inputnumber.ng-invalid.ng-dirty > .p-inputtext { border-color: <rojo-de-error>; }
p-inputnumber.ng-invalid.ng-dirty > .p-inputtext:enabled:focus { border-color: <color-de-foco>; } /* ← pisa el rojo */
```

**Síntoma original** (settings, 2026-10-05): el mensaje "El campo es requerido" se veía, pero el borde solo se ponía rojo al hacer click afuera (blur). La corrección fue local, pero como el mismo defecto afecta a login y a cualquier pantalla futura, se estandarizó.

---

## 2. Las 4 reglas (checklist)

### R1 — Clase de estado en el host del campo

Siempre con `[ngClass]`, condición **`invalid && (dirty || touched)`**, y las dos clases juntas:

```html
<p-inputNumber
    formControlName="minLength"
    [ngClass]="{ 'ng-invalid ng-dirty': form.controls.minLength.invalid && (form.controls.minLength.dirty || form.controls.minLength.touched) }"
/>
```

- **Nunca `p-invalid`**: PrimeNG no lo usa para el borde de foco y se pierde contra `:focus`.
- **Nunca solo `ng-invalid`**: la regla de PrimeNG exige la pareja `ng-invalid` **y** `ng-dirty` (Angular solo pone `ng-dirty` si el valor cambió — un campo vacío tocado quedaría sin rojo).
- Condición `dirty || touched` = el estado aparece al tocar el campo (blur o primer cambio), no al escribir cada tecla. Sin sync por tecla (decisión "opción B").

### R2 — Mensaje de error con color propio

```html
@if (form.controls.name.invalid && form.controls.name.touched) {
    <small class="block mt-1 text-red-500 dark:text-red-400">El campo es requerido.</small>
}
```

- **Nunca `class="p-error"`**: PrimeNG 21 no tiene ninguna regla CSS para `.p-error` → el texto queda sin color (hereda el normal).
- El patrón Tailwind `text-red-500 dark:text-red-400` es el de todo el proyecto (login, settings).

### R3 — Mostrar todos los errores al intentar guardar

```ts
onSubmit(): void {
    if (this.form.invalid) {
        this.form.markAllAsTouched();
        return;              // no emitir / no persistir
    }
    // ... persistir
}
```

- Errores al **tocar el campo** o al **intentar guardar** — nunca por tecla.

### R4 — Botón de guardar

```html
<p-button label="Guardar" [loading]="saving()" [disabled]="saving() || !dirty()" (onClick)="onSubmit()" />
```

- `disabled` cuando está guardando o cuando no hay cambios.

---

## 3. El override del borde rojo con foco (global)

En `src/assets/styles.scss` — **global, sin prefijo de pantalla** (decisión 2026-10-05):

```scss
html .p-inputtext.ng-invalid.ng-dirty:enabled:focus,
html p-inputnumber.ng-invalid.ng-dirty > .p-inputtext:enabled:focus,
html p-input-number.ng-invalid.ng-dirty > .p-inputtext:enabled:focus,
html p-inputNumber.ng-invalid.ng-dirty > .p-inputtext:enabled:focus,
html p-password.ng-invalid.ng-dirty .p-inputtext:enabled:focus {
    border-color: var(--p-inputtext-invalid-border-color, #f87171);
}
```

**Detalles técnicos que NO se deben "simplificar":**

| Detalle | Por qué |
|---|---|
| Prefijo `html` | Sin él, el selector empata en especificidad (0,5,1) con el de PrimeNG. PrimeNG inyecta sus `<style>` al **final** de `<head>` (`UseStyle.use()` con `first=false`), es decir **después** de nuestro `<link>` de estilos → ganaría por orden y el rojo desaparecería otra vez. `html` sube a (0,5,2) y gana siempre. |
| Token `var(--p-inputtext-invalid-border-color, #f87171)` | El token lo genera `@primeuix/styled` (prefix `p`, tema Aura → `formField.invalidBorderColor` = `red.400` en claro / `red.300` en oscuro). **Respeta dark mode automáticamente**; el fallback `#f87171` es solo por si el token no existe. |
| Sin `!important` | La especificidad + el orden resuelven; `!important` haría el override frágil ante próximos cambios del tema. |
| Las 5 variantes de selector | Cubren `p-inputNumber`/`p-input-number`/`p-inputnumber` (el host es case-insensitive pero los 3 selectores existen en PrimeNG), `p-password` (el input vive anidado, no es hijo directo) y `p-inputtext` plano. |

**Cómo replicar en otra pantalla**: no hacer nada — el override es global. Solo asegurarse de que los campos usen R1 (la clase `ng-invalid ng-dirty`), que es lo que el selector exige.

---

## 4. Dónde vive y cómo verificar

- **Override**: `src/assets/styles.scss` (sección final).
- **Spec que fija el contrato de opción B**: `settings-form-dialog.component.spec.ts` → test *"reveals section errors on a save attempt (option B)"*.
- **Verificación** (sección 5 del runbook): `pnpm exec ng lint` · `pnpm exec ng test --watch=false` · `pnpm exec ng build`.
- **Verificación visual manual**: en cualquier formulario, dejar un campo inválido, hacer click dentro → el borde debe estar rojo **con foco**; si se pone emerald/foco, el override se rompió (revisar el prefijo `html`).

---

## 5. Adoptado por (inventario 2026-10-05)

| Formulario | Estado |
|---|---|
| Settings — 4 secciones (general/auth/password/user) | ✅ R1–R4 + override |
| Login — username | ✅ corregido (`p-invalid` → R1) |
| Login — password | ✅ R1 (faltaba solo el override, ya global) |
| `role-name-dialog` (roles) | ✅ R1 + R2 (era `p-error`) |
| `role-permissions-dialog` y `settings-detail` (mensaje de error de carga) | ✅ `p-error` → `text-red-500` |
| Filtros compartidos (`filter-input`, `search`, `async-select`) | N/A — no son formularios con reglas de negocio |
| Próximos: pantallas **usuarios** y **auditorías** (Fase 2.5 residual) | Aplicar este checklist desde el día 1 |
