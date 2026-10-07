import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Dialog } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { MultiSelectModule } from 'primeng/multiselect';
import { finalize } from 'rxjs';

import { User } from '@/app/modules/security/users/domain/user';
import { UserCreateDto, UserUpdateDto } from '@/app/modules/security/users/domain/user-dtos';
import { UserListStore } from '@/app/modules/security/users/presentation/stores/user-list.store';
import { Role } from '@/app/modules/security/roles/domain/role';
import { RoleRepository } from '@/app/modules/security/roles/infrastructure/role-repository';
import { NotificationService } from '@/app/core/services/notification-services';
import { SettingsStore } from '@/app/modules/security/settings/presentation/stores/settings.store';
import { DEFAULT_SECURITY_SETTINGS, SETTINGS_RULES } from '@/app/modules/security/settings/domain/security-settings';
import { defaultQuery } from '@/app/core/interfaces/query-params';
import { minLengthFrom, passwordMatch, passwordStrength, passwordStrengthMessages } from '@/app/core/utils/custom-validators';

/**
 * Diálogo único de usuario para ALTA y EDICIÓN (mismo criterio de unificación
 * que `role-name-dialog`: sin `user` es alta, con `user` es edición).
 *
 * Diferencias de modo:
 * - Alta: usuario/contraseña/confirmación/roles obligatorios.
 * - Edición: el usuario es solo lectura (no se edita) y contraseña + roles son
 *   opcionales (contraseña vacía = no cambiar → el DTO manda `null`).
 *
 * Presentación pura: la escritura vive en el store (`createAndReload` /
 * `updateAndReload`). El catálogo de roles se trae con fetch manual
 * (`RoleRepository.list`), no `httpResource` (decisión de fase).
 *
 * Validación: estándar R1–R4 (`docs/estandar-validacion-formularios.md`).
 * La fortaleza de contraseña se lee de SettingsStore por GETTER, así que
 * aplica las reglas configuradas aunque los settings lleguen después de
 * montar el formulario (se revalida al resolver el GET).
 */
@Component({
    selector: 'app-user-dialog',
    standalone: true,
    imports: [NgClass, ReactiveFormsModule, Dialog, ButtonModule, InputTextModule, Password, MultiSelectModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <p-dialog
            [visible]="visible()"
            (visibleChange)="visible.set($event)"
            (onHide)="cancelled.emit()"
            [modal]="true"
            [closable]="!store.saving()"
            [closeOnEscape]="!store.saving()"
            [focusOnShow]="true"
            [style]="{ width: '480px' }"
            [header]="title()"
        >
            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-2">
                <label for="username">Usuario</label>
                <input
                    pInputText
                    id="username"
                    formControlName="username"
                    placeholder="Ej. aruiz"
                    autocomplete="off"
                    class="w-full"
                    [readonly]="isEdit()"
                    [ngClass]="{ 'ng-invalid ng-dirty': showError('username') }"
                />
                @if (showError('username')) {
                    <small class="block mt-1 text-red-500 dark:text-red-400">{{ usernameMessage() }}</small>
                }

                <label for="fullName">Nombre</label>
                <input
                    pInputText
                    id="fullName"
                    formControlName="fullName"
                    placeholder="Ej. Ana Ruiz"
                    autocomplete="name"
                    class="w-full"
                    [ngClass]="{ 'ng-invalid ng-dirty': showError('fullName') }"
                />
                @if (showError('fullName')) {
                    <small class="block mt-1 text-red-500 dark:text-red-400">El nombre es requerido.</small>
                }

                <label for="password">Contraseña</label>
                <p-password
                    inputId="password"
                    formControlName="password"
                    placeholder="Contraseña"
                    autocomplete="new-password"
                    [feedback]="false"
                    [toggleMask]="true"
                    styleClass="w-full"
                    [ngClass]="{ 'ng-invalid ng-dirty': showError('password') }"
                />
                @if (showError('password')) {
                    <div class="block mt-1 text-red-500 dark:text-red-400">
                        @if (passwordHasRequiredError()) {
                            <small class="block">La contraseña es requerida.</small>
                        }
                        @for (message of passwordMessages(); track message) {
                            <small class="block">{{ message }}</small>
                        }
                    </div>
                }

                <label for="passwordConfirmation">Confirmar contraseña</label>
                <p-password
                    inputId="passwordConfirmation"
                    formControlName="passwordConfirmation"
                    placeholder="Repita la contraseña"
                    autocomplete="new-password"
                    [feedback]="false"
                    [toggleMask]="true"
                    styleClass="w-full"
                    [ngClass]="{ 'ng-invalid ng-dirty': showError('passwordConfirmation') || showMismatch() }"
                />
                @if (showError('passwordConfirmation') || showMismatch()) {
                    <div class="block mt-1 text-red-500 dark:text-red-400">
                        @if (showError('passwordConfirmation') && confirmationHasRequiredError()) {
                            <small class="block">La confirmación de contraseña es requerida.</small>
                        }
                        @if (showMismatch()) {
                            <small class="block">Las contraseñas no coinciden.</small>
                        }
                    </div>
                }

                <label for="roles">Roles</label>
                <p-multiSelect
                    inputId="roles"
                    appendTo="body"
                    formControlName="roles"
                    [options]="rolesCatalog()"
                    optionLabel="name"
                    dataKey="id"
                    [disabled]="rolesLoading()"
                    [showClear]="true"
                    placeholder="Seleccione los roles"
                    [maxSelectedLabels]="3"
                    [scrollHeight]="'200px'"
                    class="w-full"
                    [ngClass]="{ 'ng-invalid ng-dirty': showError('roles') }"
                />
                @if (rolesLoading()) {
                    <small class="block mt-1 text-color-secondary">Cargando roles…</small>
                }
                @if (showError('roles')) {
                    <small class="block mt-1 text-red-500 dark:text-red-400">Debe seleccionar al menos un rol.</small>
                }

                <div class="flex justify-end gap-2 mt-4">
                    <p-button label="Cancelar" [text]="true" [disabled]="store.saving()" type="button" (onClick)="cancelled.emit()" />
                    <p-button label="Guardar" icon="pi pi-check" [loading]="store.saving()" [disabled]="store.saving() || form.pristine" type="submit" />
                </div>
            </form>
        </p-dialog>
    `
})
export class UserDialogComponent {
    /** `null` = alta. Con valor = edición. */
    readonly user = input<User | null>(null);

    readonly saved = output<void>();
    readonly cancelled = output<void>();

    protected readonly store = inject(UserListStore);
    protected readonly settings = inject(SettingsStore);
    private readonly notify = inject(NotificationService);
    private readonly fb = inject(NonNullableFormBuilder);
    private readonly roleRepository = inject(RoleRepository);
    private readonly destroyRef = inject(DestroyRef);

    /** Controlado por nosotros: el montaje lo gobierna la página, el cierre no. */
    protected readonly visible = signal(true);

    /** Catálogo de roles para el multiSelect (fetch manual al montar). */
    protected readonly rolesCatalog = signal<Role[]>([]);
    protected readonly rolesLoading = signal(false);

    protected readonly title = computed(() => (this.user() ? 'Editar usuario' : 'Nuevo usuario'));

    protected readonly form = this.fb.group({
        username: ['', [Validators.required, minLengthFrom(() => this.usernameMinLength())]],
        fullName: ['', [Validators.required]],
        password: ['', []],
        passwordConfirmation: ['', []],
        roles: [[] as Role[], []]
    }, { validators: [passwordMatch('password', 'passwordConfirmation')] });

    constructor() {
        // Los settings son un singleton root: si nadie los cargó aún, pedirlos
        // (una sola vez por app) para validar con las reglas configuradas.
        if (this.settings.current() === null) {
            this.settings.load();
        }
        this.loadRolesCatalog();

        // (a) Validadores según MODO: alta obliga contraseña/confirmación/roles;
        //     edición los deja opcionales (contraseña vacía = no cambiar).
        effect(() => {
            const isEdit = this.user() !== null;
            const password = this.form.controls.password;
            const confirmation = this.form.controls.passwordConfirmation;
            const roles = this.form.controls.roles;

            password.setValidators(isEdit
                ? [passwordStrength(() => this.passwordSettings())]
                : [Validators.required, passwordStrength(() => this.passwordSettings())]);
            confirmation.setValidators(isEdit ? [] : [Validators.required]);
            roles.setValidators(isEdit ? [] : [Validators.required]);

            password.updateValueAndValidity({ emitEvent: false });
            confirmation.updateValueAndValidity({ emitEvent: false });
            roles.updateValueAndValidity({ emitEvent: false });
            this.form.updateValueAndValidity({ emitEvent: false });
        });

        // (b) Sync input -> form: prellenar edición y arrancar PRISTINE (R4:
        //     el botón Guardar está deshabilitado hasta que haya cambios).
        //     Guard de identidad: los validadores que se ejecutan dentro de
        //     `patchValue` LEEN settings (getters), así que el effect queda
        //     suscrito a settingsSignal; sin el guard, la llegada del GET
        //     re-ejecutaría este sync y BORRARÍA lo que el usuario escribió.
        let syncedUser: User | null | undefined;
        effect(() => {
            const user = this.user();
            if (user === syncedUser) {
                return;
            }
            syncedUser = user;

            this.form.patchValue({
                username: user?.username ?? '',
                fullName: user?.fullName ?? '',
                roles: user ? [...user.roles] : []
            });
            this.form.controls.password.setValue('');
            this.form.controls.passwordConfirmation.setValue('');
            this.form.markAsPristine();
        });

        // (c) Los settings llegaron DESPUÉS de construir el formulario →
        //     revalidar con la configuración real (los getters ya leen la nueva).
        effect(() => {
            if (!this.settings.current()) {
                return;
            }
            Object.values(this.form.controls).forEach((control) => control.updateValueAndValidity({ emitEvent: false }));
            this.form.updateValueAndValidity({ emitEvent: false });
        });
    }

    // ─── Helpers de validación (condición R1/R2: invalid && (dirty || touched)) ──
    protected showError(name: 'username' | 'fullName' | 'password' | 'passwordConfirmation' | 'roles'): boolean {
        const control = this.form.controls[name];
        return control.invalid && (control.dirty || control.touched);
    }

    protected usernameMessage(): string {
        const errors = this.form.controls.username.errors;
        if (errors?.['required']) return 'El usuario es requerido.';
        if (errors?.['minlength']) return `Mínimo ${errors['minlength'].requiredLength} caracteres.`;
        return '';
    }

    protected passwordHasRequiredError(): boolean {
        return !!this.form.controls.password.errors?.['required'];
    }

    protected passwordMessages(): string[] {
        return passwordStrengthMessages(this.form.controls.password.errors);
    }

    protected confirmationHasRequiredError(): boolean {
        return !!this.form.controls.passwordConfirmation.errors?.['required'];
    }

    /** El mismatch vive en el GRUPO; se revela si el usuario tocó cualquiera de los dos campos. */
    protected showMismatch(): boolean {
        const { password, passwordConfirmation } = this.form.controls;
        return this.form.errors?.['passwordMismatch'] === true
            && (password.dirty || password.touched || passwordConfirmation.dirty || passwordConfirmation.touched);
    }

    protected isEdit(): boolean {
        return this.user() !== null;
    }

    // ─── Reglas dinámicas (settings por GETTER, nunca inline) ─────────────
    private passwordSettings() {
        return this.settings.current()?.passwordSettings ?? DEFAULT_SECURITY_SETTINGS.passwordSettings;
    }

    private usernameMinLength(): number {
        const configured = this.settings.current()?.userSettings.usernameMinLength ?? DEFAULT_SECURITY_SETTINGS.userSettings.usernameMinLength;
        // Piso del dominio: la configuración nunca puede bajar de la regla.
        return Math.max(SETTINGS_RULES.user.usernameMinLength.min, configured);
    }

    private loadRolesCatalog(): void {
        this.rolesLoading.set(true);
        this.roleRepository
            .list({ ...defaultQuery(), pag: { Page: 1, PageSize: 1000 } })
            .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.rolesLoading.set(false)))
            .subscribe({
                next: (page) => this.rolesCatalog.set(page.objects ?? []),
                error: (error: unknown) => this.notify.handleGenericError(error)
            });
    }

    // ─── Submit (R3: errores al intentar guardar) ─────────────────────────
    protected onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        // `required` no rechaza un valor de solo espacios: normalizamos y, si
        // queda vacío, reactivamos el error original para el usuario.
        const controls = this.form.controls;
        const username = controls.username.value.trim();
        const fullName = controls.fullName.value.trim();
        if (!username) {
            controls.username.setValue('');
            controls.username.markAsTouched();
            return;
        }
        if (!fullName) {
            controls.fullName.setValue('');
            controls.fullName.markAsTouched();
            return;
        }

        const roleIds = controls.roles.value.map((role) => role.id);
        const password = controls.password.value;
        const passwordConfirmation = controls.passwordConfirmation.value;
        const user = this.user();

        const request$ = user
            ? this.store.updateAndReload(user.id, {
                fullName,
                password: password || null,
                passwordConfirmation: passwordConfirmation || null,
                roleIds
            } satisfies UserUpdateDto)
            : this.store.createAndReload({
                userName: username,
                fullName,
                password,
                passwordConfirmation,
                roleIds
            } satisfies UserCreateDto);

        const successMessage = user ? 'Usuario actualizado correctamente.' : 'Usuario creado correctamente.';
        request$.subscribe({
            next: () => {
                this.notify.show('success', successMessage);
                this.saved.emit();
            },
            error: (error: unknown) => this.notify.handleGenericError(error)
        });
    }
}
