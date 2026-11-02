import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { UserTableComponent } from '@/app/modules/security/users/presentation/components/user-table/user-table.component';
import { UserDialogComponent } from '@/app/modules/security/users/presentation/components/user-dialog/user-dialog.component';
import { UserDetailDialogComponent } from '@/app/modules/security/users/presentation/components/user-detail-dialog/user-detail-dialog.component';
import { UserListStore } from '@/app/modules/security/users/presentation/stores/user-list.store';
import { ColumnConfig } from '@/app/core/interfaces/column-config';
import { User } from '@/app/modules/security/users/domain/user';
import { TableAction } from '@/app/core/interfaces/table-action';
import { ToolbarComponent } from '@/app/shared/components/generictToolbar/toolbar.component';
import { SearchComponent } from '@/app/shared/components/search/search.component';
import { NotificationService } from '@/app/core/services/notification-services';
import { ACTIONS } from '@/app/core/constants/actions';
import { RESOURCES } from '@/app/core/constants/resources';
import { PageChangeEvent } from '@/app/core/interfaces/page-change-event';
import { handlePageChange } from '@/app/core/helpers/page-change.helper';
import { confirmAndRun } from '@/app/core/helpers/confirm-action.helper';

@Component({
    selector: 'app-users',
    standalone: true,
    imports: [UserTableComponent, UserDialogComponent, UserDetailDialogComponent, ToolbarComponent, SearchComponent, ConfirmDialog],
    providers: [UserListStore, ConfirmationService],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        @if (store.modalMode() === 'add') {
            <app-user-dialog (saved)="onDialogSaved()" (cancelled)="store.closeModalAndClearSelection()" />
        }
        @if (store.modalMode() === 'edit') {
            @if (store.selectedItem(); as user) {
                <app-user-dialog [user]="user" (saved)="onDialogSaved()" (cancelled)="store.closeModalAndClearSelection()" />
            }
        }
        @if (store.modalMode() === 'detail') {
            @if (store.selectedItem(); as user) {
                <app-user-detail-dialog [user]="user" (closed)="store.closeModalAndClearSelection()" />
            }
        }

        <div class="card flex flex-col gap-8">
            <app-toolbar [resource]="RESOURCES.Users" [actions]="[ACTIONS.Create]" (created)="store.openAdd()" [config]="{ visible: true, addLabel: 'Nuevo Usuario' }">
                <div toolbar-end>
                    <app-search [searchText]="store.searchText()" (searchSubmitted)="store.setSearchAndReload($event)"></app-search>
                </div>
            </app-toolbar>

            <app-user-table
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
export class UsersPage implements OnInit {
    readonly store = inject(UserListStore);
    private readonly confirm = inject(ConfirmationService);
    private readonly notify = inject(NotificationService);

    // Usuario · Nombre: sin ID (§9.3), el ID vive solo en el detalle.
    readonly columns: ColumnConfig<User>[] = [
        { field: 'username', header: 'Usuario', sortable: false },
        { field: 'fullName', header: 'Nombre', sortable: false }
    ];

    /** Oculta usuarios no editables del listado (mismo criterio que roles). */
    readonly items = computed(() => this.store.entities().filter((user) => !user.isUnEditable));

    readonly rowActions = computed<TableAction<User>[]>(() => [
        {
            label: 'Detalles',
            icon: 'pi pi-eye',
            permission: { resource: RESOURCES.Users, action: ACTIONS.Read },
            command: (row) => this.store.openDetail(row)
        },
        {
            label: 'Editar',
            icon: 'pi pi-pencil',
            permission: { resource: RESOURCES.Users, action: ACTIONS.Update },
            visible: (row) => !row.isUnEditable,
            command: (row) => this.store.openEdit(row)
        },
        {
            // Sin acción propia en el contrato RBAC: restablecer la contraseña
            // es una MODIFICACIÓN del usuario → Update.
            label: 'Restablecer contraseña',
            icon: 'pi pi-key',
            permission: { resource: RESOURCES.Users, action: ACTIONS.Update },
            command: (row) => this.onResetPassword(row)
        },
        {
            label: 'Eliminar',
            icon: 'pi pi-trash',
            severity: 'danger',
            permission: { resource: RESOURCES.Users, action: ACTIONS.Delete },
            visible: (row) => !row.isUnDeletable,
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

    onDelete(user: User): void {
        confirmAndRun({
            confirm: this.confirm,
            notify: this.notify,
            header: 'Confirmar eliminación',
            message: `¿Está seguro de eliminar el usuario "${user.username}"?`,
            acceptLabel: 'Eliminar',
            acceptSeverity: 'danger',
            action$: () => this.store.deleteAndReload(user.id),
            successMessage: 'Usuario eliminado correctamente.'
        });
    }

    onResetPassword(user: User): void {
        confirmAndRun({
            confirm: this.confirm,
            notify: this.notify,
            header: 'Confirmar',
            message: `¿Desea restablecer la contraseña del usuario "${user.username}"?`,
            acceptLabel: 'Restablecer',
            acceptSeverity: 'primary',
            action$: () => this.store.resetPassword(user.id),
            successMessage: 'Contraseña restablecida correctamente.'
        });
    }

    protected readonly ACTIONS = ACTIONS;
    protected readonly RESOURCES = RESOURCES;
}
