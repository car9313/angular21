import { Component, computed, inject, input, output } from '@angular/core';
import { ColumnConfig } from '@/app/core/interfaces/column-config';
import { TableAction } from '@/app/core/interfaces/table-action';
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
import { TableModule } from 'primeng/table';

import { useSelectedItem, useTableMenu, usePagination, useEmptySearchDescription, useLazyLoad, useTogglePending } from '@/app/core/hooks';
import { Municipality } from '@/app/modules/nomenclators/municipalities/domain/municipality';

export interface MunicipalityToggleEvent {
    municipality: Municipality;
    active: boolean;
}

const EMPTY_PENDING: ReadonlySet<string> = new Set<string>();

@Component({
    selector: 'app-municipality-table',
    imports: [Button, EmptyStateComponent, Menu, Skeleton, TableModule, Tooltip, NgClass, ToggleSwitch, FormsModule],
    templateUrl: './municipality-table.html',
    styleUrl: './municipality-table.scss',
    standalone: true,
    providers: [TableActionMenuService]
})
export class MunicipalityTable {
    readonly items = input.required<Municipality[]>();
    readonly columns = input.required<ColumnConfig<Municipality>[]>();
    readonly rowActions = input<TableAction<Municipality>[]>([]);
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

    readonly selectRow = output<Municipality>();
    readonly edit = output<Municipality>();
    readonly view = output<Municipality>();
    readonly remove = output<Municipality>();
    readonly pageChange = output<PageChangeEvent>();
    readonly toggleActive = output<MunicipalityToggleEvent>();

    private readonly menuService = inject(TableActionMenuService<Municipality>);

    private readonly pagination = usePagination(this.currentPage, this.pageSize, this.totalRecords, this.rowsPerPageOptions);

    private readonly menu = useTableMenu(this.menuService, this.rowActions);

    private readonly toggle = useTogglePending<Municipality, string>(
        this.pendingCode,
        this.canToggle,
        (municipality) => municipality.code,
        (municipality, active) => this.toggleActive.emit({ municipality, active })
    );

    readonly first = this.pagination.first;
    readonly visibleRowsPerPageOptions = this.pagination.visibleRowsPerPageOptions;
    readonly selectedItem = useSelectedItem(this.items, this.selectedCode, (municipality) => municipality.code);
    readonly emptySearchDescription = useEmptySearchDescription('municipios', this.searchText);

    readonly hasActionColumn = computed(() => this.items().some((item) => this.menuService.hasAnyAction(item, this.rowActions())));

    readonly skeletonRows = Array.from({ length: 5 }, (_, i) => i);

    readonly menuFor = this.menu.menuFor;
    readonly isMenuOpen = this.menu.isMenuOpen;
    readonly onMenuShow = this.menu.onMenuShow;
    readonly onMenuHide = this.menu.onMenuHide;

    readonly isToggling = this.toggle.isToggling;
    readonly onToggleActive = this.toggle.onToggleActive;

    readonly onLazyLoad = useLazyLoad(this.currentPage, this.pageSize, (e) => this.pageChange.emit(e));

    onRowSelect(row: Municipality | Municipality[] | undefined): void {
        if (!row || Array.isArray(row)) return;
        this.selectRow.emit(row);
    }
}
