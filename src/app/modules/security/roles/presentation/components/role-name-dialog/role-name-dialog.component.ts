import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Dialog } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

import { Role } from '@/app/modules/security/roles/domain/role';
import { RoleListStore } from '@/app/modules/security/roles/presentation/stores/role-list.store';
import { NotificationService } from '@/app/core/services/notification-services';

/**
 * Diálogo único de nombre de rol para ALTA y EDICIÓN.
 *
 * Devueltos separa esto en `add-role` y `update-role`, duplicando el mismo
 * formulario de un campo en dos componentes. Acá se unifica: sin `role` es
 * alta, con `role` es edición. Si la edición gana campos propios, ahí sí se
 * separa.
 *
 * Es presentación pura: el alta/edición viven en el store (`createAndReload`
 * / `updateAndReload`). Este componente solo arma el formulario, dispara y
 * notifica.
 */
@Component({
    selector: 'app-role-name-dialog',
    standalone: true,
    imports: [ReactiveFormsModule, Dialog, ButtonModule, InputTextModule],
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
            [style]="{ width: '450px' }"
            [header]="title()"
        >
            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-2">
                <label for="role-name">Nombre del rol</label>
                <input
                    pInputText
                    id="role-name"
                    formControlName="name"
                    placeholder="Ej. Supervisor"
                    autocomplete="off"
                    class="w-full"
                />
                @if (form.controls.name.invalid && form.controls.name.touched) {
                    <small class="p-error">El nombre es requerido.</small>
                }

                <div class="flex justify-end gap-2 mt-4">
                    <p-button label="Cancelar" [text]="true" [disabled]="store.saving()" type="button" (onClick)="cancelled.emit()" />
                    <p-button label="Guardar" icon="pi pi-check" [loading]="store.saving()" type="submit" />
                </div>
            </form>
        </p-dialog>
    `
})
export class RoleNameDialogComponent {
    /** `null` = alta. Con valor = edición. */
    readonly role = input<Role | null>(null);

    readonly saved = output<void>();
    readonly cancelled = output<void>();

    protected readonly store = inject(RoleListStore);
    private readonly notify = inject(NotificationService);
    private readonly fb = inject(NonNullableFormBuilder);

    /** Controlado por nosotros: el montaje lo gobierna la página, el cierre no. */
    protected readonly visible = signal(true);

    protected readonly title = computed(() => (this.role() ? 'Editar rol' : 'Nuevo rol'));

    protected readonly form = this.fb.group({
        name: ['', [Validators.required]]
    });

    constructor() {
        // Sync input -> form: edit mode must PRE-FILL the field with the role's
        // current name. `role` arrives via @if-mounted input (null = create),
        // so without this the dialog always opened empty on edit.
        effect(() => {
            const name = this.role()?.name ?? '';
            const control = this.form.controls.name;
            if (control.value !== name) {
                control.setValue(name);
            }
        });
    }

    protected onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        // `required` no rechaza un valor de solo espacios: lo normalizamos y,
        // si queda vacío, reactivamos el error original para el usuario.
        const name = this.form.controls.name.value.trim();
        if (!name) {
            this.form.controls.name.setValue('');
            this.form.controls.name.markAsTouched();
            return;
        }

        const role = this.role();
        const request$ = role ? this.store.updateAndReload(role.id, name) : this.store.createAndReload(name);
        const successMessage = role ? 'Rol actualizado correctamente.' : 'Rol creado correctamente.';

        request$.subscribe({
            next: () => {
                this.notify.show('success', successMessage);
                this.saved.emit();
            },
            error: (error: unknown) => this.notify.handleGenericError(error)
        });
    }
}
