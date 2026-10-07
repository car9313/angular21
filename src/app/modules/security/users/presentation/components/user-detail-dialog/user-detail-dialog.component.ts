import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { Dialog } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { Chip } from 'primeng/chip';

import { User } from '@/app/modules/security/users/domain/user';

/**
 * Detalle de solo lectura de un usuario: datos básicos + roles con sus
 * permisos (chips por acción). El ID se muestra ací (vista de detalle, no la
 * grilla): la regla "sin ID" del §9.3 aplica a las columnas de la tabla.
 *
 * Presentación pura: recibe el `user` ya cargado desde `store.selectedItem()`
 * (el listado trae `roles[]` con permisos) y emite `closed` al cerrar.
 */
@Component({
    selector: 'app-user-detail-dialog',
    standalone: true,
    imports: [Dialog, ButtonModule, Chip],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <p-dialog
            [visible]="visible()"
            (visibleChange)="visible.set($event)"
            (onHide)="closed.emit()"
            [modal]="true"
            [maximizable]="true"
            [style]="{ width: '720px' }"
            [contentStyle]="{ 'max-height': '70vh', overflow: 'auto' }"
            header="Detalles del usuario"
        >
            @if (user(); as u) {
                <div class="flex flex-col gap-4">
                    <div class="grid grid-cols-2 gap-x-8 gap-y-3">
                        <div class="flex gap-2 items-center">
                            <span class="font-bold">ID:</span>
                            <p class="text-color-secondary whitespace-pre-wrap">{{ u.id }}</p>
                        </div>
                        <div class="flex gap-2 items-center">
                            <span class="font-bold">Usuario:</span>
                            <p class="text-color-secondary whitespace-pre-wrap">{{ u.username }}</p>
                        </div>
                        <div class="flex gap-2 items-center col-span-2">
                            <span class="font-bold">Nombre:</span>
                            <p class="text-color-secondary whitespace-pre-wrap">{{ u.fullName || 'Sin nombre' }}</p>
                        </div>
                        <div class="flex gap-2 items-center">
                            <span class="font-bold">Editable:</span>
                            <p class="text-color-secondary">{{ u.isUnEditable ? 'No' : 'Sí' }}</p>
                        </div>
                        <div class="flex gap-2 items-center">
                            <span class="font-bold">Eliminable:</span>
                            <p class="text-color-secondary">{{ u.isUnDeletable ? 'No' : 'Sí' }}</p>
                        </div>
                    </div>

                    <div class="mt-2">
                        <span class="font-bold block mb-2">Roles y permisos</span>
                        @if (u.roles.length) {
                            <div class="flex flex-col gap-3">
                                @for (role of u.roles; track role.id) {
                                    <div class="border-1 surface-border border-round p-3">
                                        <div class="flex gap-2 items-center mb-2">
                                            <span class="font-bold">{{ role.name }}</span>
                                            @if (role.isUnEditable) {
                                                <span class="text-xs text-color-secondary">No editable</span>
                                            }
                                            @if (role.isUnDeletable) {
                                                <span class="text-xs text-color-secondary">No eliminable</span>
                                            }
                                        </div>
                                        @if (role.permissions.length) {
                                            <div class="flex flex-col gap-2">
                                                @for (perm of role.permissions; track perm.resource) {
                                                    <div class="grid grid-cols-[30%_1fr] items-start gap-4">
                                                        <span class="text-sm font-medium">{{ perm.description || perm.resource }}</span>
                                                        <div class="flex flex-wrap gap-1">
                                                            @for (action of perm.actions; track action) {
                                                                <p-chip [label]="action" />
                                                            }
                                                        </div>
                                                    </div>
                                                }
                                            </div>
                                        } @else {
                                            <p class="text-sm text-color-secondary">Sin permisos asignados</p>
                                        }
                                    </div>
                                }
                            </div>
                        } @else {
                            <p class="text-color-secondary">Sin roles asignados</p>
                        }
                    </div>
                </div>
            }

            <ng-template #footer>
                <p-button label="Cerrar" icon="pi pi-times" (onClick)="closed.emit()" />
            </ng-template>
        </p-dialog>
    `
})
export class UserDetailDialogComponent {
    readonly user = input.required<User>();

    readonly closed = output<void>();

    protected readonly visible = signal(true);
}
