import { Component, computed, inject, input, output } from '@angular/core';
import { ColumnConfig } from '@/app/core/interfaces/column-config';
import { TableAction } from '@/app/core/interfaces/table-action';
import { Country } from '@/app/modules/nomenclators/countries/domain/country';
import { PageChangeEvent } from '@/app/core/interfaces/page-change-event';
import { TableActionMenuService } from '@/app/core/services/table-action-menu';
import { Button } from 'primeng/button';
import { EmptyStateComponent } from '@/app/shared/components/empty-state/empty-state.component';
import { Menu } from 'primeng/menu';
import { Skeleton } from 'primeng/skeleton';
import { Tooltip } from 'primeng/tooltip';
import { NgClass } from '@angular/common';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { FormsModule } from '@angular/forms';
import { useEmptySearchDescription, useLazyLoad, usePagination, useSelectedItem, useTableMenu, useTogglePending } from '@/app/core/hooks';
import { TableModule } from 'primeng/table';

export interface CountryToggleEvent {
    country: Country;
    active: boolean;
}
const EMPTY_PENDING: ReadonlySet<string> = new Set<string>();

@Component({
    selector: 'app-country-table',
    imports: [Button, EmptyStateComponent, Menu, Skeleton, TableModule, Tooltip, NgClass, ToggleSwitch, FormsModule],
    templateUrl: './country-table.html',
    styleUrl: './country-table.scss',
    standalone: true,
    providers: [TableActionMenuService]
})
export class CountryTable {
    readonly items = input.required<Country[]>();
    readonly columns = input.required<ColumnConfig<Country>[]>();
    readonly rowActions = input<TableAction<Country>[]>([]);
    readonly selectedCode = input<string | null>(null);
    readonly loading = input(false);
    readonly error = input<string | null>(null);
    readonly totalRecords = input(0);
    readonly currentPage = input(1);
    readonly pageSize = input(10);
    readonly rowsPerPageOptions = input([5, 10, 20]);
    readonly searchText = input('');
    readonly canToggle = input(false);
    readonly pendingCode = input<ReadonlySet<string>>(EMPTY_PENDING);

    readonly selectRow = output<Country>();
    readonly edit = output<Country>();
    readonly view = output<Country>();
    readonly remove = output<Country>();
    readonly pageChange = output<PageChangeEvent>();
    readonly toggleActive = output<CountryToggleEvent>();

    private readonly menuService = inject(TableActionMenuService<Country>);

    private readonly pagination = usePagination(this.currentPage, this.pageSize, this.totalRecords, this.rowsPerPageOptions);

    private readonly menu = useTableMenu(this.menuService, this.rowActions);

    private readonly toggle = useTogglePending<Country, string>(
        this.pendingCode,
        this.canToggle,
        (c) => c.code,
        (c, active) => this.toggleActive.emit({ country: c, active })
    );

    readonly selectedItem = useSelectedItem(this.items, this.selectedCode, (c) => c.code);
    readonly emptySearchDescription = useEmptySearchDescription('países', this.searchText);

    readonly isToggling = this.toggle.isToggling;
    readonly onToggleActive = this.toggle.onToggleActive;

    readonly onLazyLoad = useLazyLoad(this.currentPage, this.pageSize, (e) => this.pageChange.emit(e));

    // ─── API expuesta a la plantilla ────────────────────────────────────
    readonly first = this.pagination.first;
    readonly visibleRowsPerPageOptions = this.pagination.visibleRowsPerPageOptions;

    readonly hasActionColumn = computed(() => this.items().some((item) => this.menuService.hasAnyAction(item, this.rowActions())));

    readonly skeletonRows = Array.from({ length: 5 }, (_, i) => i);

    readonly menuFor = this.menu.menuFor;
    readonly isMenuOpen = this.menu.isMenuOpen;
    readonly onMenuShow = this.menu.onMenuShow;
    readonly onMenuHide = this.menu.onMenuHide;

    onRowSelect(row: Country | Country[] | undefined): void {
        if (!row || Array.isArray(row)) return;
        this.selectRow.emit(row);
    }
}
