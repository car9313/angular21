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

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [ButtonModule, InputTextModule, MessageModule, PasswordModule, ReactiveFormsModule, RouterModule, RippleModule, AppFloatingConfigurator],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <app-floating-configurator />
        <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-screen overflow-hidden">
            <div class="flex flex-col items-center justify-center">
                <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                    <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                        <div class="text-center mb-8">
                            <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Bienvenido</div>
                            <span class="text-muted-color font-medium">Ingresá para continuar</span>
                        </div>

                        <form [formGroup]="form" (ngSubmit)="submit()">
                            <label for="username" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Usuario</label>
                            <input pInputText id="username" formControlName="username" autocomplete="username" placeholder="Usuario" class="w-full md:w-120 mb-4" [class.ng-dirty]="form.controls.username.invalid && form.controls.username.touched" [invalid]="form.controls.username.invalid && form.controls.username.touched" />

                            <label for="password" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Contraseña</label>
                            <p-password id="password" formControlName="password" autocomplete="current-password" placeholder="Contraseña" [toggleMask]="true" [feedback]="false" [fluid]="true" [class.mb-4]="true" [invalid]="form.controls.password.invalid && form.controls.password.touched" />

                            @if (errorMessage(); as error) {
                                <p-message severity="error" [text]="error" styleClass="w-full mb-4" />
                            }

                            <p-button type="submit" label="Ingresar" styleClass="w-full" [loading]="submitting()" [disabled]="submitting()" />
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

    readonly form = this.fb.group({
        username: this.fb.control('', [Validators.required]),
        password: this.fb.control('', [Validators.required])
    });

    readonly submitting = signal(false);
    readonly errorMessage = signal<string | null>(null);

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

            // No returnUrl tracking (team decision 2026-09-22, parity with
            // the reference project): login always lands on the home page.
            await this.router.navigateByUrl('/');
        } catch {
            this.errorMessage.set('Usuario o contraseña incorrectos. Intentá de nuevo.');
        } finally {
            this.submitting.set(false);
        }
    }
}
