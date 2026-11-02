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
import { Province } from '@/app/modules/nomenclators/provinces/domain/province';

import { useSelectedItem, useTableMenu, usePagination, useEmptySearchDescription, useLazyLoad, useTogglePending } from '@/app/core/hooks';
import { TableModule } from 'primeng/table';

export interface ProvinceToggleEvent {
    province: Province;
    active: boolean;
}
const EMPTY_PENDING: ReadonlySet<string> = new Set<string>();

@Component({
    selector: 'app-province-table',
    imports: [Button, EmptyStateComponent, Menu, Skeleton, TableModule, Tooltip, NgClass, ToggleSwitch, FormsModule],
    templateUrl: './province-table.html',
    styleUrl: './province-table.scss',
    standalone: true,
    providers: [TableActionMenuService]
})
export class ProvinceTable {
    // ─── Inputs ─────────────────────────────────────────────────────────
    readonly items = input.required<Province[]>();
    readonly columns = input.required<ColumnConfig<Province>[]>();
    readonly rowActions = input<TableAction<Province>[]>([]);
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

    // ─── Outputs ────────────────────────────────────────────────────────
    readonly selectRow = output<Province>();
    readonly edit = output<Province>();
    readonly view = output<Province>();
    readonly remove = output<Province>();
    readonly pageChange = output<PageChangeEvent>();
    readonly toggleActive = output<ProvinceToggleEvent>();

    // ─── Dependencias ───────────────────────────────────────────────────
    private readonly menuService = inject(TableActionMenuService<Province>);

    // ─── Hooks ──────────────────────────────────────────────────────────
    private readonly pagination = usePagination(this.currentPage, this.pageSize, this.totalRecords, this.rowsPerPageOptions);

    private readonly menu = useTableMenu(this.menuService, this.rowActions);

    private readonly toggle = useTogglePending<Province, string>(
        this.pendingCode,
        this.canToggle,
        (p) => p.code,
        (p, active) => this.toggleActive.emit({ province: p, active })
    );

    // ─── API expuesta a la plantilla ────────────────────────────────────
    readonly first = this.pagination.first;
    readonly visibleRowsPerPageOptions = this.pagination.visibleRowsPerPageOptions;
    readonly selectedItem = useSelectedItem(this.items, this.selectedCode, (p) => p.code);
    readonly emptySearchDescription = useEmptySearchDescription('provincias', this.searchText);

    readonly hasActionColumn = computed(() => this.items().some((item) => this.menuService.hasAnyAction(item, this.rowActions())));

    readonly skeletonRows = Array.from({ length: 5 }, (_, i) => i);

    readonly menuFor = this.menu.menuFor;
    readonly isMenuOpen = this.menu.isMenuOpen;
    readonly onMenuShow = this.menu.onMenuShow;
    readonly onMenuHide = this.menu.onMenuHide;

    readonly isToggling = this.toggle.isToggling;
    readonly onToggleActive = this.toggle.onToggleActive;

    readonly onLazyLoad = useLazyLoad(this.currentPage, this.pageSize, (e) => this.pageChange.emit(e));

    // ─── Handler suelto (no merece hook: 3 líneas, sin variación) ────────
    onRowSelect(row: Province | Province[] | undefined): void {
        if (!row || Array.isArray(row)) return;
        this.selectRow.emit(row);
    }
}
