import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { PageChangeEvent, RoleTableComponent } from '@/app/modules/security/roles/presentation/components/role-table/role-table.component';
import { RoleNameDialogComponent } from '@/app/modules/security/roles/presentation/components/role-name-dialog/role-name-dialog.component';
import { RolePermissionsDialogComponent } from '@/app/modules/security/roles/presentation/components/role-permissions-dialog/role-permissions-dialog.component';
import { RoleListStore } from '@/app/modules/security/roles/presentation/stores/role-list.store';
import { ColumnConfig } from '@/app/core/interfaces/column-config';
import { Role } from '@/app/modules/security/roles/domain/role';
import { TableAction } from '@/app/core/interfaces/table-action';
import { ToolbarComponent } from '@/app/shared/components/generictToolbar/toolbar.component';
import { SearchComponent } from '@/app/shared/components/search/search.component';
import { NotificationService } from '@/app/core/services/notification-services';
import { ACTIONS } from '@/app/core/constants/actions';
import { RESOURCES } from '@/app/core/constants/resources';

@Component({
    selector: 'app-roles',
    standalone: true,
    imports: [RoleTableComponent, RoleNameDialogComponent, RolePermissionsDialogComponent, ToolbarComponent, SearchComponent, ConfirmDialog],
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
            <!--            <app-role-filters />-->

            <app-toolbar [resource]="RESOURCES.Roles" [actions]="[ACTIONS.Create]" (created)="store.openAdd()" [config]="{ visible: true }">
                <div toolbar-end>
                    <app-search [searchText]="store.searchText()" (searchSubmitted)="store.setSearchAndReload($event)"></app-search>
                </div>
            </app-toolbar>

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

    readonly columns: ColumnConfig<Role>[] = [
        { field: 'id', header: 'ID', sortable: false, className: 'text-center' },
        { field: 'name', header: 'Nombre', sortable: false }
    ];

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
            permission: { resource: RESOURCES.Roles, action: ACTIONS.Delete },
            visible: (row) => !row.isUnEditable && !row.isUnDeletable,
            command: (row) => this.onDelete(row)
        }
    ]);

    ngOnInit(): void {
        this.store.load(this.store.query());
    }

    onPageChange({ page, pageSize }: PageChangeEvent): void {
        if (pageSize !== this.store.pageSize()) {
            this.store.setPageSizeAndReload(pageSize);
        } else {
            this.store.setPageAndReload(page);
        }
    }

    /** El store ya recargó; solo hay que cerrar el diálogo. */
    onDialogSaved(): void {
        this.store.closeModalAndClearSelection();
    }

    onDelete(role: Role): void {
        this.confirm.confirm({
            message: `¿Está seguro de eliminar el rol "${role.name}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonProps: { label: 'Eliminar', severity: 'danger' },
            rejectButtonProps: { label: 'Cancelar', severity: 'secondary', text: true },
            accept: () => {
                this.store.deleteAndReload(role.id).subscribe({
                    next: () => this.notify.show('success', 'Rol eliminado correctamente.'),
                    error: (error: unknown) => this.notify.handleGenericError(error)
                });
            }
        });
    }

    protected readonly ACTIONS = ACTIONS;
    protected readonly RESOURCES = RESOURCES;
}
