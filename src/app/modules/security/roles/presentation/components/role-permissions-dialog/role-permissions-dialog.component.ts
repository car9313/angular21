// src/app/modules/security/roles/presentation/components/role-permissions-dialog/role-permissions-dialog.component.ts
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { Dialog } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinner } from 'primeng/progressspinner';
import type { TreeNode } from 'primeng/api';

import { Role } from '@/app/modules/security/roles/domain/role';
import { RolePermissionsStore } from '@/app/modules/security/roles/presentation/stores/role-permissions.store';
import { PermissionsTreeComponent } from '@/app/shared/components/permissions-tree/permissions-tree.component';
import { PermissionsTreeMapperService } from '@/app/shared/components/permissions-tree/services/permissions-tree-mapper.service';
import { NotificationService } from '@/app/core/services/notification-services';

/**
 * Diálogo de permisos por rol.
 *
 * Presentación pura sobre `RolePermissionsStore` (provisto aquí: nace y muere
 * con el diálogo). Responsabilidades:
 * - Cargar catálogo + permisos del rol al abrir (effect sobre `role`).
 * - Sembrar la selección inicial desde las claves asignadas (tri-state visual).
 * - Emitir `saved`/`cancelled`; el store decide guardar y la página cierra.
 *
 * El estado de selección es local SEÑAL: el effect solo re-siembra cuando el
 * store completa una carga (`loading` pasa a false); los toggles del usuario
 * no se pisan porque no cambian las dependencias del effect.
 */
@Component({
    selector: 'app-role-permissions-dialog',
    standalone: true,
    imports: [Dialog, ButtonModule, ProgressSpinner, PermissionsTreeComponent],
    providers: [RolePermissionsStore],
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
            [style]="{ width: '620px' }"
            [header]="'Permisos de ' + role().name"
        >
            @if (store.loading()) {
                <div class="flex justify-center p-6">
                    <p-progressspinner styleClass="w-8 h-8" />
                </div>
            } @else if (store.error(); as error) {
                <div class="flex flex-col items-center gap-3 p-4">
                    <p class="p-error text-center">{{ error }}</p>
                    <p-button label="Reintentar" icon="pi pi-refresh" severity="secondary" (onClick)="store.load(role().id)" />
                </div>
            } @else if (treeData().length === 0) {
                <div class="p-4 text-surface-500">No hay permisos configurados para asignar.</div>
            } @else {
                <app-permissions-tree
                    [treeData]="treeData()"
                    [selectedNodes]="selection()"
                    (selectionChange)="onSelectionChange($event)"
                />

                <div class="flex justify-end gap-2 mt-4">
                    <p-button label="Cancelar" [text]="true" [disabled]="store.saving()" type="button" (onClick)="cancelled.emit()" />
                    <p-button label="Guardar" icon="pi pi-check" [loading]="store.saving()" (onClick)="onSubmit()" />
                </div>
            }
        </p-dialog>
    `
})
export class RolePermissionsDialogComponent {
    readonly role = input.required<Role>();

    readonly saved = output<void>();
    readonly cancelled = output<void>();

    protected readonly store = inject(RolePermissionsStore);
    private readonly mapper = inject(PermissionsTreeMapperService);
    private readonly notify = inject(NotificationService);

    /** Controlado por nosotros: el montaje lo gobierna la página, el cierre no. */
    protected readonly visible = signal(true);

    /** Árbol completo desde el catálogo (categorías → recursos → acciones). */
    protected readonly treeData = computed(() => this.mapper.mapToTreeNodes(this.store.catalog()));

    /** Selección local: sembrada por el store, actualizada por el usuario. */
    protected readonly selection = signal<TreeNode[]>([]);

    constructor() {
        // Carga al abrir: el input `role` se resuelve en el primer flush.
        effect(() => {
            const role = this.role();
            if (role) {
                this.store.load(role.id);
            }
        });

        // Re-siembra SOLO cuando el store completa una carga: la selección del
        // usuario (toggles) no altera catalog/assignedKeys, así que no se pisa.
        effect(() => {
            if (this.store.loading()) return;
            const tree = this.treeData();
            const assigned = this.store.assignedKeys();
            this.selection.set(this.mapper.computeSelectedNodes(tree, assigned));
        });
    }

    protected onSelectionChange(event: TreeNode[] | TreeNode | null): void {
        if (event === null) {
            this.selection.set([]);
        } else {
            this.selection.set(Array.isArray(event) ? event : [event]);
        }
    }

    protected onSubmit(): void {
        if (this.store.saving()) return;

        this.store.save(this.selection()).subscribe({
            next: () => {
                this.notify.show('success', 'Permisos actualizados correctamente.');
                this.saved.emit();
            },
            error: (error: unknown) => this.notify.handleGenericError(error)
        });
    }
}