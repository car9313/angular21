import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit } from '@angular/core';
import { NotificationService } from '@/app/core/services/notification-services';
import { ColumnConfig } from '@/app/core/interfaces/column-config';
import { TableAction } from '@/app/core/interfaces/table-action';
import { RESOURCES } from '@/app/core/constants/resources';
import { ACTIONS } from '@/app/core/constants/actions';
import { PageChangeEvent } from '@/app/core/interfaces/page-change-event';
import { HasPermissionDirective } from '@/app/shared/directives/has-permission.directive';
import { IconButtonComponent } from '@/app/shared/icon-button/icon-button.component';
import { SearchComponent } from '@/app/shared/components/search/search.component';
import { SessionStore } from '@/app/core/store/session.store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { handlePageChange } from '@/app/core/helpers/page-change.helper';
import { ProvinceListStore } from '@/app/modules/nomenclators/provinces/presentation/stores/province-list.store';
import { Province } from '@/app/modules/nomenclators/provinces/domain/province';
import {
    ProvinceTable
} from '@/app/modules/nomenclators/provinces/presentation/components/province-table/province-table';
import {
    ProvinceDetailDialog
} from '@/app/modules/nomenclators/provinces/presentation/components/province-detail-dialog/province-detail-dialog';
import {
    ProvinceDialog
} from '@/app/modules/nomenclators/provinces/presentation/components/province-dialog/province-dialog';

export interface ProvinceToggleEvent {
    province: Province;
    active: boolean;
}

@Component({
    selector: 'app-provinces.page',
    standalone: true,
    imports: [HasPermissionDirective, IconButtonComponent, SearchComponent, ProvinceTable, ProvinceDetailDialog, ProvinceDialog],
    templateUrl: './provinces.page.html',
    styleUrl: './provinces.page.scss',
    providers: [ProvinceListStore],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProvincesPage implements OnInit {
    readonly store = inject(ProvinceListStore);
    private readonly notify = inject(NotificationService);
    private readonly session = inject(SessionStore);
    private readonly destroyRef = inject(DestroyRef);

    readonly columns: ColumnConfig<Province>[] = [
        { field: 'code', header: 'Código', sortable: false },
        { field: 'descShort', header: 'Acrónimo' },
        { field: 'descLong', header: 'Nombre', sortable: false },
        {
            field: 'active',
            header: 'Activo',
            sortable: false,
            className: 'text-center'
        }
    ];

    readonly items = computed(() => this.store.entities());

    readonly canToggle = computed(() => this.session.hasPermission(RESOURCES.Nomenclators, [ACTIONS.Update]));

    readonly rowActions = computed<TableAction<Province>[]>(() => [
        {
            label: 'Editar',
            icon: 'pi pi-pencil',
            permission: { resource: RESOURCES.Nomenclators, action: ACTIONS.Update },
            command: (row) => this.store.openEdit(row)
        },
        {
            label: 'Ver Detalles',
            icon: 'pi pi-eye',
            permission: { resource: RESOURCES.Nomenclators, action: ACTIONS.Read },
            command: (row) => this.store.openDetail(row)
        }
    ]);

    ngOnInit(): void {
        this.store.load();
    }

    onPageChange(e: PageChangeEvent): void {
        handlePageChange(this.store, e);
    }

    onToggleActive({ province, active }: ProvinceToggleEvent): void {
        if (this.store.isPending(province.code)) return;

        this.store
            .setActive(province, active)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => this.notify.show('success', active ? 'Provincia activada correctamente.' : 'Provincia desactivada correctamente.'),
                error: (error: unknown) => this.notify.handleGenericError(error)
            });
    }

    onDialogSaved(): void {
        this.store.closeModalAndClearSelection();
    }

    protected readonly RESOURCES = RESOURCES;
    protected readonly ACTIONS = ACTIONS;
}
