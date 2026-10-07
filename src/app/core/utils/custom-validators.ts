import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { PasswordSettings } from '@/app/modules/security/settings/domain/security-settings';

/**
 * Validadores de negocio reutilizables por cualquier formulario con reglas
 * propias del dominio (usuarios, cambio de contraseña, etc.).
 *
 * Toman la configuración por GETTER (`() => cfg`) en vez de por valor: las
 * reglas de seguridad viven en SettingsStore, que puede resolver DESPUÉS de
 * construir el formulario (GET en vuelo). El getter se lee en cada ejecución
 * del validador, así que nunca se quedan reglas viejas "congeladas".
 */

/**
 * Fortaleza de contraseña según `PasswordSettings` (minLength + requires*).
 * Vacío → `null`: quién decide si es obligatoria (alta vs edición) es la
 * regla `required` del formulario, no este validador.
 *
 * Error: `{ passwordStrength: { minlength, uppercase, lowercase, digits, specialChar } }`.
 */
export function passwordStrength(settings: () => PasswordSettings): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const value = control.value;
        if (typeof value !== 'string' || value.length === 0) {
            return null;
        }

        const cfg = settings();
        const errors: ValidationErrors = {};

        if (value.length < cfg.minLength) {
            errors['minlength'] = { requiredLength: cfg.minLength, actualLength: value.length };
        }
        if (cfg.requiresUppercase && !/[A-Z]/.test(value)) {
            errors['uppercase'] = true;
        }
        if (cfg.requiresLowercase && !/[a-z]/.test(value)) {
            errors['lowercase'] = true;
        }
        if (cfg.requiresDigits && !/[0-9]/.test(value)) {
            errors['digits'] = true;
        }
        if (cfg.requiresSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
            errors['specialChar'] = true;
        }

        return Object.keys(errors).length > 0 ? { passwordStrength: errors } : null;
    };
}

/** Mensajes legibles (uno por regla incumplida) para el `passwordStrength`. */
export function passwordStrengthMessages(errors: ValidationErrors | null | undefined): string[] {
    const strength = errors?.['passwordStrength'];
    if (!strength) {
        return [];
    }

    const messages: string[] = [];
    if (strength['minlength']) {
        messages.push(`La contraseña debe tener al menos ${strength['minlength'].requiredLength} caracteres.`);
    }
    if (strength['uppercase']) {
        messages.push('Debe contener al menos una letra mayúscula.');
    }
    if (strength['lowercase']) {
        messages.push('Debe contener al menos una letra minúscula.');
    }
    if (strength['digits']) {
        messages.push('Debe contener al menos un número.');
    }
    if (strength['specialChar']) {
        messages.push('Debe contener al menos un símbolo (!@#$%^&*(),.?":{}|<>).');
    }
    return messages;
}

/**
 * Validador a nivel GRUPO: password y confirmación deben coincidir.
 * Solo valida si el usuario escribió algo en ALGÚNO de los dos campos
 * (en edición ambos pueden quedarse vacíos = "no cambiar contraseña").
 * Error: `{ passwordMismatch: true }` sobre el FormGroup.
 */
export function passwordMatch(passwordKey: string, confirmationKey: string): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
        const password = group.get(passwordKey)?.value;
        const confirmation = group.get(confirmationKey)?.value;

        if (!password && !confirmation) {
            return null;
        }
        return password === confirmation ? null : { passwordMismatch: true };
    };
}

/**
 * Longitud mínima por GETTER (para settings que recién se cargan).
 * Produce la clave estándar `minlength` para reutilizar los mensajes de Angular.
 */
export function minLengthFrom(minLength: () => number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const value = typeof control.value === 'string' ? control.value : '';
        const requiredLength = minLength();
        if (value.length >= requiredLength) {
            return null;
        }
        return { minlength: { requiredLength, actualLength: value.length } };
    };
}
