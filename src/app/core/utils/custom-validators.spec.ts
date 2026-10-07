import { describe, it, expect } from 'vitest';
import { FormControl, FormGroup } from '@angular/forms';
import { minLengthFrom, passwordMatch, passwordStrength, passwordStrengthMessages } from './custom-validators';
import { DEFAULT_SECURITY_SETTINGS, PasswordSettings } from '@/app/modules/security/settings/domain/security-settings';

const STRICT: PasswordSettings = DEFAULT_SECURITY_SETTINGS.passwordSettings; // min 8, todo requerido

const lax = (overrides: Partial<PasswordSettings>): PasswordSettings => ({ ...STRICT, ...overrides });

describe('passwordStrength', () => {
    it('passes on empty values (required is the form rule, not this one)', () => {
        const validator = passwordStrength(() => STRICT);
        expect(validator(new FormControl(''))).toBeNull();
        expect(validator(new FormControl(null))).toBeNull();
    });

    it('reports every broken rule of the default profile on a weak password', () => {
        const validator = passwordStrength(() => STRICT);
        const errors = validator(new FormControl('abc'))?.['passwordStrength'];

        expect(errors['minlength']).toEqual({ requiredLength: 8, actualLength: 3 });
        expect(errors['uppercase']).toBe(true);
        expect(errors['digits']).toBe(true);
        expect(errors['specialChar']).toBe(true);
    });

    it('accepts a password that satisfies the configured profile', () => {
        const validator = passwordStrength(() => STRICT);
        expect(validator(new FormControl('Abcdef1!'))).toBeNull();
    });

    it('honours disabled requirements of the profile', () => {
        const validator = passwordStrength(() =>
            lax({ requiresUppercase: false, requiresSpecialChars: false, minLength: 4 })
        );
        expect(validator(new FormControl('abcd1234'))).toBeNull();
    });

    it('reads the profile lazily so late-arriving settings apply immediately', () => {
        let profile = lax({ minLength: 4 });
        const validator = passwordStrength(() => profile);

        expect(validator(new FormControl('Ab1!'))).toBeNull(); // 4 chars con perfil viejo
        profile = lax({ minLength: 12 });
        const errors = validator(new FormControl('Ab1!'))?.['passwordStrength'];
        expect(errors['minlength']).toEqual({ requiredLength: 12, actualLength: 4 });
    });
});

describe('passwordStrengthMessages', () => {
    it('maps each broken rule to its user-facing message', () => {
        const validator = passwordStrength(() => STRICT);
        const messages = passwordStrengthMessages(validator(new FormControl('abc')));

        expect(messages).toContain('La contraseña debe tener al menos 8 caracteres.');
        expect(messages).toContain('Debe contener al menos una letra mayúscula.');
        expect(messages).toContain('Debe contener al menos un número.');
    });

    it('returns no messages when there is no strength error', () => {
        expect(passwordStrengthMessages(null)).toEqual([]);
        expect(passwordStrengthMessages(undefined)).toEqual([]);
        expect(passwordStrengthMessages({ minlength: {} })).toEqual([]);
    });
});

describe('passwordMatch', () => {
    const build = (password: string, confirmation: string) =>
        passwordMatch('password', 'passwordConfirmation')(
            new FormGroup({ password: new FormControl(password), passwordConfirmation: new FormControl(confirmation) })
        );

    it('passes when both fields are empty (edition = no password change)', () => {
        expect(build('', '')).toBeNull();
    });

    it('passes when both fields match', () => {
        expect(build('Abcdef1!', 'Abcdef1!')).toBeNull();
    });

    it('fails when only one field has a value', () => {
        expect(build('Abcdef1!', '')?.['passwordMismatch']).toBe(true);
        expect(build('', 'Abcdef1!')?.['passwordMismatch']).toBe(true);
    });

    it('fails when both differ', () => {
        expect(build('Abcdef1!', 'Abcdef2!')?.['passwordMismatch']).toBe(true);
    });
});

describe('minLengthFrom', () => {
    it('passes at or above the configured minimum', () => {
        const validator = minLengthFrom(() => 5);
        expect(validator(new FormControl('aruiz'))).toBeNull();
    });

    it('fails below the minimum with the standard minlength shape', () => {
        const validator = minLengthFrom(() => 5);
        const errors = validator(new FormControl('ab'));
        expect(errors).toEqual({ minlength: { requiredLength: 5, actualLength: 2 } });
    });

    it('reads the minimum lazily (settings loaded after form build)', () => {
        let min = 3;
        const validator = minLengthFrom(() => min);
        expect(validator(new FormControl('abc'))).toBeNull();
        min = 8;
        expect(validator(new FormControl('abc'))?.['minlength']).toEqual({ requiredLength: 8, actualLength: 3 });
    });
});
