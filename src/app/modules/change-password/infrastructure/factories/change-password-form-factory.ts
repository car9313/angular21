import { Injectable, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { PasswordSettings } from '@/app/modules/security/settings/domain/security-settings';
import { passwordMatch, passwordStrength } from '@/app/core/utils/custom-validators';


export interface ChangePasswordControls  {
    password: FormControl<string>;
    passwordConfirmation: FormControl<string>;
}

@Injectable({ providedIn: 'root' })
export class ChangePasswordFormFactory {
    private fb = inject(FormBuilder);

    /**
     * Crea un FormGroup para el formulario de cambio de contraseña.
     * Recibe la config por GETTER para que las reglas (que viven en SettingsStore
     * y pueden resolver después) se lean en cada validación, no al construir el form.
     */
    create(pwdSettings: () => PasswordSettings): FormGroup<ChangePasswordControls> {
        return this.fb.group<ChangePasswordControls>(
            {
                password: this.fb.nonNullable.control('', [Validators.required, passwordStrength(pwdSettings)]),
                passwordConfirmation: this.fb.nonNullable.control('', Validators.required)
            },
            {
                validators: passwordMatch('password', 'passwordConfirmation')
            }
        );
    }
}
