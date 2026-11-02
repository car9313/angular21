import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, OnInit } from '@angular/core';
import { CountriesListStore } from '@/app/modules/nomenclators/countries/presentation/stores/countries-list.store';
import { NotificationService } from '@/app/core/services/notification-services';
import { ColumnConfig } from '@/app/core/interfaces/column-config';
import { Country } from '@/app/modules/nomenclators/countries/domain/country';
import { TableAction } from '@/app/core/interfaces/table-action';
import { RESOURCES } from '@/app/core/constants/resources';
import { ACTIONS } from '@/app/core/constants/actions';
import { PageChangeEvent } from '@/app/core/interfaces/page-change-event';
import { HasPermissionDirective } from '@/app/shared/directives/has-permission.directive';
import { IconButtonComponent } from '@/app/shared/icon-button/icon-button.component';
import { SearchComponent } from '@/app/shared/components/search/search.component';
import { CountryTable, CountryToggleEvent } from '@/app/modules/nomenclators/countries/presentation/components/country-table/country-table';
import { CountryDialog } from '@/app/modules/nomenclators/countries/presentation/components/country-dialog/country-dialog';
import { CountryDetailDialog } from '@/app/modules/nomenclators/countries/presentation/components/country-detail-dialog/country-detail-dialog';
import { SessionStore } from '@/app/core/store/session.store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { handlePageChange } from '@/app/core/helpers/page-change.helper';
@Component({
    selector: 'app-countries.page',
    standalone: true,
    imports: [HasPermissionDirective, IconButtonComponent, SearchComponent, CountryTable, CountryDialog, CountryDetailDialog],
    templateUrl: './countries.page.html',
    styleUrl: './countries.page.scss',
    providers: [CountriesListStore],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CountriesPage implements OnInit {
    readonly store = inject(CountriesListStore);
    private readonly notify = inject(NotificationService);
    private readonly session = inject(SessionStore);
    private readonly destroyRef = inject(DestroyRef);

    constructor() {
        effect(() => console.log('ENTITIES', this.store.entities(), 'META', this.store.meta(), 'PAGE', this.store.currentPage(), 'SIZE', this.store.pageSize()));
    }
    readonly columns: ColumnConfig<Country>[] = [
        { field: 'name', header: 'Nombre', sortable: false },
        { field: 'code', header: 'Código', sortable: false },
        {
            field: 'active',
            header: 'Activo',
            sortable: false,
            className: 'text-center'
        }
    ];

    readonly items = computed(() => this.store.entities());

    readonly canToggle = computed(() => this.session.hasPermission(RESOURCES.Nomenclators, [ACTIONS.Update]));

    readonly rowActions = computed<TableAction<Country>[]>(() => [
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

    onToggleActive({ country, active }: CountryToggleEvent): void {
        if (this.store.isPending(country.code)) return;

        this.store
            .setActive(country, active)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => this.notify.show('success', active ? 'País activado correctamente.' : 'País desactivado correctamente.'),
                error: (error: unknown) => this.notify.handleGenericError(error)
            });
    }

    onDialogSaved(): void {
        this.store.closeModalAndClearSelection();
    }

    protected readonly RESOURCES = RESOURCES;
    protected readonly ACTIONS = ACTIONS;
}
