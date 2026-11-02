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
import {
    MunicipalityDialog
} from '@/app/modules/nomenclators/municipalities/presentation/components/municipality-dialog/municipality-dialog';
import {
    MunicipalityListStore
} from '@/app/modules/nomenclators/municipalities/presentation/stores/municipality-list.store';
import { Municipality } from '@/app/modules/nomenclators/municipalities/domain/municipality';
import {
    MunicipalityTable,
    MunicipalityToggleEvent
} from '@/app/modules/nomenclators/municipalities/presentation/components/municipality-table/municipality-table';
import {
    MunicipalityDetailDialog
} from '@/app/modules/nomenclators/municipalities/presentation/components/municipality-detail-dialog/municipality-detail-dialog';

@Component({
    selector: 'app-municipality.page',
    standalone: true,
    imports: [HasPermissionDirective, IconButtonComponent, SearchComponent, MunicipalityDialog, MunicipalityTable, MunicipalityDetailDialog],
    templateUrl: './municipality.page.html',
    styleUrl: './municipality.page.scss',
    providers: [MunicipalityListStore],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MunicipalityPage implements OnInit {
    readonly store = inject(MunicipalityListStore);
    private readonly notify = inject(NotificationService);
    private readonly session = inject(SessionStore);
    private readonly destroyRef = inject(DestroyRef);

    readonly columns: ColumnConfig<Municipality>[] = [
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

    readonly rowActions = computed<TableAction<Municipality>[]>(() => [
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

    onToggleActive({ municipality, active }: MunicipalityToggleEvent): void {
        if (this.store.isPending(municipality.code)) return;

        this.store
            .setActive(municipality, active)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => this.notify.show('success', active ? 'Municipio activado correctamente.' : 'Municipio desactivado correctamente.'),
                error: (error: unknown) => this.notify.handleGenericError(error)
            });
    }

    onDialogSaved(): void {
        this.store.closeModalAndClearSelection();
    }

    protected readonly RESOURCES = RESOURCES;
    protected readonly ACTIONS = ACTIONS;
}
