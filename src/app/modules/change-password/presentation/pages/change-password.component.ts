import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { Toast } from 'primeng/toast';
import { FloatLabel } from 'primeng/floatlabel';
import { NgClass } from '@angular/common';
import { first, firstValueFrom } from 'rxjs';

import { ChangePasswordRepository } from '../../infrastructure/api/change-password-repository';
import { ChangePasswordControls, ChangePasswordFormFactory } from '../../infrastructure/factories/change-password-form-factory';
import { ChangePassword } from '../../domain/change-password';
import { LoadingButtonComponent } from '@/app/shared/components/loading-button/loading-button.component';
import { NotificationService } from '@/app/core/services/notification-services';
import { makeSecuritySettings, PasswordSettings } from '@/app/modules/security/settings/domain/security-settings';
import { SettingsRepository } from '@/app/modules/security/settings/infrastructure/settings-repository';
import { passwordStrengthMessages } from '@/app/core/utils/custom-validators';

@Component({
    selector: 'app-change-password',
    standalone: true,
    imports: [LoadingButtonComponent, ReactiveFormsModule, RouterModule, InputTextModule, PasswordModule, ButtonModule, Toast, FloatLabel, NgClass],
    templateUrl: './change-password.component.html',
    styles: [
        `
            :host {
                --login-field-border: color-mix(in srgb, var(--primary-color) 70%, #000);
                --login-card-ring: color-mix(in srgb, var(--primary-color) 45%, #000);
            }

            :host-context(.app-dark) .login-card {
                box-shadow: 0 0 0 1px var(--login-card-ring);
            }

            /* Igual que en Login: borde tintado en dark para inputs anidados.
               ::ng-deep necesario porque p-password no expone el input externo. */
            :host-context(.app-dark) ::ng-deep .p-inputtext {
                border-color: var(--login-field-border);
            }

            .bgLogin {
                background: radial-gradient(circle, rgba(44, 147, 114, 1) 0%, rgba(36, 46, 120, 0.9808298319327731) 100%);
            }
        `
    ]
})
export class ChangePasswordComponent {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private settingRepository = inject(SettingsRepository);
    private changePasswordUseCase = inject(ChangePasswordRepository);
    private notificationService = inject(NotificationService);
    private getSettings = this.settingRepository.get();
    private formFactory = inject(ChangePasswordFormFactory);

    isSaving = false;
    defaultSettings = makeSecuritySettings();

    /** Signal con las reglas activas leídas por el factory vía getter. */
    private passwordSettings = signal<PasswordSettings>(this.defaultSettings.passwordSettings);

    protected readonly form: FormGroup<ChangePasswordControls> = this.formFactory.create(() => this.passwordSettings());

    constructor() {
        void this.fetchAndApplySettings();
    }

    private async fetchAndApplySettings(): Promise<void> {
        try {
            const settings = await firstValueFrom(this.getSettings);
            if (settings?.passwordSettings) {
                this.passwordSettings.set(settings.passwordSettings);
                this.control('password').updateValueAndValidity({ emitEvent: true });
            }
        } catch (err) {
            console.error('Error loading settings, using defaults', err);
        }
    }

    // ─── Acceso seguro a los controles tipados ─────────────────────────
    protected control<K extends keyof ChangePasswordControls>(name: K) {
        return this.form.controls[name];
    }

    // ─── Helpers de validación (R1/R2) ─────────────────────────────────

    protected showError(name: keyof ChangePasswordControls): boolean {
        const ctrl = this.control(name);
        return ctrl.invalid && (ctrl.dirty || ctrl.touched);
    }

    protected hasError(controlName: keyof ChangePasswordControls, errorType: string): boolean {
        const ctrl = this.control(controlName);
        return !!(ctrl?.hasError(errorType) && (ctrl?.touched || ctrl?.dirty));
    }

    protected passwordMessages(): string[] {
        return passwordStrengthMessages(this.control('password').errors);
    }

    protected passwordHasRequiredError(): boolean {
        return !!this.control('password').errors?.['required'];
    }

    protected confirmationHasRequiredError(): boolean {
        return !!this.control('passwordConfirmation').errors?.['required'];
    }

    protected showMismatch(): boolean {
        if (this.form.errors?.['passwordMismatch'] !== true) return false;
        const { password, passwordConfirmation } = this.form.controls;
        return password.dirty || password.touched || passwordConfirmation.dirty || passwordConfirmation.touched;
    }

    protected getError(field: keyof ChangePasswordControls): string | null {
        const ctrl = this.control(field);
        if (!ctrl?.errors) return null;

        if (field === 'password') {
            if (ctrl.errors['required']) return 'El password es requerido.';
            if (ctrl.errors['passwordStrength']) return null;
        }
        if (field === 'passwordConfirmation') {
            if (ctrl.errors['required']) return 'La confirmación de contraseña es requerida.';
        }
        return null;
    }

    protected getPasswordErrors(): string[] {
        return this.passwordMessages();
    }

    protected getPasswordConfirmationError(): string | null {
        return this.showMismatch() ? 'Las contraseñas no coinciden' : null;
    }

    // ─── Submit ────────────────────────────────────────────────────────
    save(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        this.isSaving = true;

        const token = this.route.snapshot.paramMap.get('token')!;
        if (!token) {
            this.isSaving = false;
            this.notificationService.show('error', 'Token no válido');
            return;
        }

        const payload: ChangePassword = {
            newPassword: this.control('password').value,
            newPasswordConfirm: this.control('passwordConfirmation').value,
            token
        };

        this.changePasswordUseCase
            .changePassword(payload)
            .pipe(first())
            .subscribe({
                next: (resp) => {
                    this.isSaving = false;
                    this.notificationService.verification(resp);
                    this.router
                        .navigate(['/login'])
                        .then()
                        .catch(() => undefined);
                },
                error: (err) => {
                    this.isSaving = false;
                    this.notificationService.verification(err);
                    if (err.status === 401) {
                        this.router
                            .navigate(['/login'])
                            .then()
                            .catch(() => undefined);
                    }
                }
            });
    }
}
