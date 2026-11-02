import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';
import { LoginUseCase } from '../../modules/auth/application/login.use-case';
import { FloatLabel } from 'primeng/floatlabel';
import { Toast } from 'primeng/toast';
import { NgClass } from '@angular/common';
import { NotificationService } from '@/app/core/services/notification-services';
import { HttpErrorResponse } from '@angular/common/http';

/** Shape of the backend's ProblemDetails error body. */
interface ProblemDetailsLike {
    title?: string;
    detail?: string;
}

/**
 * Maps a failed login to the user-facing message: the backend's ProblemDetails
 * detail when present (e.g. "Existe una sesión activa desde otro navegador"),
 * otherwise the generic credentials message.
 */
function extractLoginError(error: unknown): string {
    const problem = (error as { error?: ProblemDetailsLike } | null)?.error;
    const detail = problem?.detail?.trim();
    return detail || 'Usuario o contraseña incorrectos. Intentá de nuevo.';
}

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [ButtonModule, InputTextModule, MessageModule, PasswordModule, ReactiveFormsModule, RouterModule, RippleModule, AppFloatingConfigurator, FloatLabel, Toast, NgClass],
    changeDetection: ChangeDetectionStrategy.OnPush,
    styles: [
        `
            /*
             * Dark-mode accents derive from --primary-color (CORPORATE_PRIMARY
             * through the preset), never from fixed brand hexes: change the
             * primary and the login follows automatically.
             */
            :host {
                --login-field-border: color-mix(in srgb, var(--primary-color) 70%, #000);
                --login-card-ring: color-mix(in srgb, var(--primary-color) 45%, #000);
            }

            :host-context(.app-dark) .login-card {
                box-shadow: 0 0 0 1px var(--login-card-ring);
            }

            /* Default PrimeNG dark border (~1.7:1) vanishes against the deep
               card; the primary-tinted border keeps fields identifiable.
               Invalid/focus states keep their own (higher-specificity) colors. */
            :host-context(.app-dark) .p-inputtext,
            :host-context(.app-dark) ::ng-deep .p-inputtext {
                border-color: var(--login-field-border);
            }
            .p-float-label input:focus ~ label {
                --tw-text-opacity: 1;
                color: rgb(5 46 22 / var(--tw-text-opacity, 1));
            }

            .bgLogin {
                background: radial-gradient(circle, rgba(44, 147, 114, 1) 0%, rgba(36, 46, 120, 0.9808298319327731) 100%);
                //  background: radial-gradient(circle, var(--primary-color) 0%, rgba(36,46,120,0.9808298319327731) 100%);
            }

            /* --- Logo animations --- */

            @keyframes logo-pulse {
                0%,
                100% {
                    transform: scale(1);
                    opacity: 1;
                }
                50% {
                    transform: scale(1.05);
                    opacity: 0.85;
                }
            }

            .animate-logo-pulse {
                animation: logo-pulse 1.2s ease-in-out infinite;
            }

            @keyframes logo-success {
                0% {
                    transform: scale(1);
                    opacity: 1;
                    filter: none;
                }
                50% {
                    transform: scale(1.2);
                    opacity: 1;
                    filter: drop-shadow(0 0 12px rgba(44, 147, 114, 0.8));
                }
                100% {
                    transform: scale(0.8);
                    opacity: 0;
                    filter: drop-shadow(0 0 20px rgba(44, 147, 114, 1));
                }
            }

            .animate-logo-success {
                animation: logo-success 0.7s ease-in-out forwards;
            }

            @keyframes logo-error {
                0%,
                100% {
                    transform: translateX(0);
                    filter: none;
                }
                10%,
                30%,
                50%,
                70%,
                90% {
                    transform: translateX(-6px);
                }
                20%,
                40%,
                60%,
                80% {
                    transform: translateX(6px);
                }
                50% {
                    filter: hue-rotate(300deg) saturate(2);
                }
            }

            .animate-logo-error {
                animation: logo-error 0.5s ease-in-out;
            }
        `
    ],
    template: `
        <app-floating-configurator />
        <p-toast position="bottom-right" styleClass="custom-toast" [showTransitionOptions]="'300ms'"></p-toast>

        <div class="bgLogin flex items-center justify-center min-h-screen min-w-screen overflow-hidden bgLogin">
            <div class="flex flex-col items-center justify-center">
                <div style="--view-transition-name: login-form-container; border-radius: 40px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                    <div
                        class="w-full bg-primary-50 dark:bg-primary-950 login-card py-20 px-8 sm:px-20 transition-all duration-500 ease-in-out"
                        [class.scale-95]="loginSuccess"
                        [class.opacity-0]="loginSuccess"
                        style="border-radius: 40px; transition-delay: 200ms"
                    >
                        <div class="text-center mb-8">
                            <img
                                src="../../../../../assets/img/logos/logo.svg"
                                alt="Logo Devueltos"
                                class="mb-8 shrink-0 mx-auto w-28 sm:w-36 md:w-44 h-auto transition-all duration-500"
                                [class.animate-logo-pulse]="submitting() && !loginSuccess && !loginFailed"
                                [class.animate-logo-success]="loginSuccess"
                                [class.animate-logo-error]="loginFailed"
                            />
                            <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Inicio de sesión</div>
                            <span class="text-muted-color font-medium"> Inicia sesión para continuar </span>
                        </div>

                        <form (ngSubmit)="submit()" [formGroup]="form">
                            <!-- Usuario -->
                            <div class="mb-4">
                                <p-floatlabel variant="on">
                                    <input
                                        pInputText
                                        id="username"
                                        formControlName="username"
                                        autocomplete="off"
                                        class="w-full md:w-[20rem]"
                                        [ngClass]="{
                                            'ng-invalid ng-dirty': form.get('username')?.invalid && (form.get('username')?.dirty || form.get('username')?.touched)
                                        }"
                                    />
                                    <label class="text-gray-500 dark:text-gray-300" for="username"> Usuario </label>
                                </p-floatlabel>

                                @if (hasError('username', 'required')) {
                                    <small class="block mt-1 text-red-500 dark:text-red-400"> El usuario es requerido </small>
                                }
                            </div>

                            <!-- Password -->
                            <div class="mb-4">
                                <p-floatlabel variant="on">
                                    <p-password
                                        inputId="password"
                                        formControlName="password"
                                        [toggleMask]="true"
                                        feedback="false"
                                        autocomplete="off"
                                        required
                                        fluid
                                        [ngClass]="{
                                            'ng-invalid ng-dirty': form.get('password')?.invalid && (form.get('password')?.dirty || form.get('password')?.touched)
                                        }"
                                    />
                                    <label class="text-gray-500 dark:text-gray-300" for="password"> Contraseña </label>
                                </p-floatlabel>

                                @if (hasError('password', 'required')) {
                                    <small class="block mt-1 text-red-500 dark:text-red-400"> La contraseña es requerida </small>
                                }

                                @if (hasError('password', 'minlength')) {
                                    <small class="block mt-1 text-red-500 dark:text-red-400"> Mínimo 6 caracteres. </small>
                                }
                            </div>
                            <p-button type="submit" label="Iniciar sesión" styleClass="w-full" [loading]="submitting()" [disabled]="submitting()" />

                            <!-- Botón -->
                            <!--  <div class="mt-6">
                                <p-button type="submit" label="Iniciar sesión" class="w-full p-button-lg p-button-primary" [loading]="authenticating" [disabled]="form.invalid" />

                            </div>-->
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class Login {
    private readonly loginUseCase = inject(LoginUseCase);
    private readonly router = inject(Router);
    private readonly fb = inject(NonNullableFormBuilder);

    protected readonly notificacionService = inject(NotificationService);

    readonly form = this.fb.group({
        username: this.fb.control('', [Validators.required]),
        password: this.fb.control('', [Validators.required])
    });

    readonly submitting = signal(false);
    readonly errorMessage = signal<string | null>(null);

    protected loginSuccess = false;
    protected loginFailed = false;

    async submit(): Promise<void> {
        if (this.form.invalid || this.submitting()) {
            this.form.markAllAsTouched();
            return;
        }

        this.submitting.set(true);
        this.errorMessage.set(null);

        const { username, password } = this.form.getRawValue();

        try {
            await this.loginUseCase.execute(username, password);
            await this.router.navigateByUrl('/');
        } catch (error: unknown) {
            if (error instanceof HttpErrorResponse) {
                // Error HTTP controlado por el backend (ProblemDetails)
                // ─── AÑADIR ESTA RAMA ────────────────────────────────────────
                if (error.status === 428) {
                    const token = error.headers.get('x-change-password-token') ?? '';
                    await this.router.navigate(['/cambiar-contraseña', token]);
                    return;
                }

                this.errorMessage.set(extractLoginError(error));
                this.notificacionService.verification(error);
            } else {
                // Error inesperado (red, timeout, etc.)
                this.errorMessage.set('Ocurrió un error inesperado. Intentá de nuevo.');
                console.error('Login error no manejado:', error);
            }
        } finally {
            this.submitting.set(false);
        }
    }
    protected hasError(controlName: string, typeError: string) {
        const control = this.form.get(controlName);
        return !!(control && control.hasError(typeError) && (control.touched || control.dirty));
    }
}
