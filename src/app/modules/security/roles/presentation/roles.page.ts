import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { RoleTableComponent } from '@/app/modules/security/roles/presentation/components/role-table/role-table.component';
import { RoleNameDialogComponent } from '@/app/modules/security/roles/presentation/components/role-name-dialog/role-name-dialog.component';
import { RolePermissionsDialogComponent } from '@/app/modules/security/roles/presentation/components/role-permissions-dialog/role-permissions-dialog.component';
import { RoleListStore } from '@/app/modules/security/roles/presentation/stores/role-list.store';
import { ColumnConfig } from '@/app/core/interfaces/column-config';
import { Role } from '@/app/modules/security/roles/domain/role';
import { TableAction } from '@/app/core/interfaces/table-action';
import { SearchComponent } from '@/app/shared/components/search/search.component';
import { NotificationService } from '@/app/core/services/notification-services';
import { ACTIONS } from '@/app/core/constants/actions';
import { RESOURCES } from '@/app/core/constants/resources';
import { IconButtonComponent } from '@/app/shared/icon-button/icon-button.component';
import { HasPermissionDirective } from '@/app/shared/directives/has-permission.directive';
import { PageChangeEvent } from '@/app/core/interfaces/page-change-event';
import { handlePageChange } from '@/app/core/helpers/page-change.helper';
import { confirmAndRun } from '@/app/core/helpers/confirm-action.helper';

@Component({
    selector: 'app-roles',
    standalone: true,
    imports: [RoleTableComponent, RoleNameDialogComponent, RolePermissionsDialogComponent, SearchComponent, ConfirmDialog, IconButtonComponent, HasPermissionDirective],
    providers: [RoleListStore, ConfirmationService],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        @if (store.modalMode() === 'add') {
            <app-role-name-dialog (saved)="onDialogSaved()" (cancelled)="store.closeModalAndClearSelection()" />
        }
        @if (store.modalMode() === 'edit') {
            @if (store.selectedItem(); as role) {
                <app-role-name-dialog [role]="role" (saved)="onDialogSaved()" (cancelled)="store.closeModalAndClearSelection()" />
            }
        }
        @if (store.modalMode() === 'permissions') {
            @if (store.selectedItem(); as role) {
                <app-role-permissions-dialog [role]="role" (saved)="onDialogSaved()" (cancelled)="store.closeModalAndClearSelection()" />
            }
        }
        <div class="card flex flex-col gap-8">
            <!-- <app-toolbar [resource]="RESOURCES.Roles" [actions]="[ACTIONS.Create]" (created)="store.openAdd()" [config]="{ visible: true, addLabel: 'Nuevo Rol' }">
                &lt;!&ndash; Botón de alta y buscador agrupados a la derecha: el toolbar
                     empuja start a la izquierda, así que el cluster completo
                     (alta + búsqueda) se coloca en toolbar-end. &ndash;&gt;
                <div toolbar-end></div>
            </app-toolbar>-->

            <div class="flex justify-between items-center">
                <app-icon-button *appHasPermission="let ok; resource: RESOURCES.Roles; actions: [ACTIONS.Read]" icon="pi pi-plus" [tooltip]="'Adicionar'" severity="primary" extraClass="shadow-md download-btn" (clicked)="store.openAdd()" />
                <app-search [searchText]="store.searchText()" (searchSubmitted)="store.setSearchAndReload($event)"></app-search>
            </div>

            <app-role-table
                [items]="items()"
                [columns]="columns"
                [rowActions]="rowActions()"
                [selectedId]="store.selectedId()"
                [loading]="store.loading()"
                [error]="store.error()"
                [totalRecords]="store.meta().totalCount"
                [currentPage]="store.currentPage()"
                [pageSize]="store.pageSize()"
                [searchText]="store.searchText()"
                (selectRow)="store.select($event.id)"
                (pageChange)="onPageChange($event)"
            />

            <p-confirm-dialog [style]="{ width: '450px' }" />
        </div>
    `
})
export class RolesPage implements OnInit {
    readonly store = inject(RoleListStore);
    private readonly confirm = inject(ConfirmationService);
    private readonly notify = inject(NotificationService);

    // Solo el nombre: el ID es ruido visual para el usuario de negocio.
    readonly columns: ColumnConfig<Role>[] = [{ field: 'name', header: 'Nombre', sortable: false }];

    readonly items = computed(() => this.store.entities().filter((role) => !role.isUnEditable));

    readonly rowActions = computed<TableAction<Role>[]>(() => [
        {
            label: 'Editar',
            icon: 'pi pi-pencil',
            permission: { resource: RESOURCES.Roles, action: ACTIONS.Update },
            visible: (row) => !row.isUnEditable,
            command: (row) => this.store.openEdit(row)
        },
        {
            label: 'Permisos',
            icon: 'pi pi-lock',
            permission: { resource: RESOURCES.Roles, action: ACTIONS.Update },
            visible: (row) => !row.isUnEditable,
            command: (row) => this.store.openPermissions(row)
        },
        {
            label: 'Eliminar',
            icon: 'pi pi-trash',
            severity: 'danger',
            permission: { resource: RESOURCES.Roles, action: ACTIONS.Delete },
            visible: (row) => !row.isUnEditable && !row.isUnDeletable,
            command: (row) => this.onDelete(row)
        }
    ]);

    ngOnInit(): void {
        this.store.load();
    }

    onPageChange(e: PageChangeEvent): void {
        handlePageChange(this.store, e);
    }

    /** El store ya recargó; solo hay que cerrar el diálogo. */
    onDialogSaved(): void {
        this.store.closeModalAndClearSelection();
    }

    onDelete(role: Role): void {
        confirmAndRun({
            confirm: this.confirm,
            notify: this.notify,
            header: 'Confirmar eliminación',
            message: `¿Está seguro de eliminar el rol "${role.name}"?`,
            acceptLabel: 'Eliminar',
            acceptSeverity: 'danger',
            action$: () => this.store.deleteAndReload(role.id),
            successMessage: 'Rol eliminado correctamente.'
        });
    }

    protected readonly ACTIONS = ACTIONS;
    protected readonly RESOURCES = RESOURCES;
}
