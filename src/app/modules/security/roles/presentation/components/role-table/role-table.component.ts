import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { InputTextModule } from 'primeng/inputtext';
import { Skeleton } from 'primeng/skeleton';
import { Tooltip } from 'primeng/tooltip';
import { MenuItem } from 'primeng/api';


import { EmptyStateComponent } from '../../../../../../shared/components/empty-state/empty-state.component';
import { Role } from '@/app/modules/security/roles/domain/role';
import { TableActionMenuService } from '@/app/core/services/table-action-menu';
import { TableAction } from '@/app/core/interfaces/table-action';
import { ColumnConfig } from '@/app/core/interfaces/column-config';
import { getPaginated } from '@/app/core/helpers/table-lazy-load.helper';

export interface PageChangeEvent {
    page: number;
    pageSize: number;
}

@Component({
    selector: 'app-role-table',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, MenuModule, InputTextModule, Skeleton, Tooltip, EmptyStateComponent],
    templateUrl: './role-table.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TableActionMenuService]
})
export class RoleTableComponent {
    // ─── Inputs ─────────────────────────────────────────────────────────
    readonly items = input.required<Role[]>();
    readonly columns = input.required<ColumnConfig<Role>[]>();
    readonly rowActions = input<TableAction<Role>[]>([]);
    readonly selectedId = input<number | null>(null);
    readonly loading = input(false);
    readonly error = input<string | null>(null);
    readonly totalRecords = input(0);
    readonly currentPage = input(1);
    readonly pageSize = input(10);
    readonly rowsPerPageOptions = input([5, 10, 20]);

    // ─── Outputs ────────────────────────────────────────────────────────
    readonly selectRow = output<Role>();
    readonly edit = output<Role>();
    readonly view = output<Role>();
    readonly remove = output<Role>();
    readonly permissions = output<Role>();
    readonly pageChange = output<PageChangeEvent>();

    // ─── Dependencias de presentación (NO del store) ────────────────────
    private readonly menuService = inject(TableActionMenuService<Role>);

    // ─── Derivados ──────────────────────────────────────────────────────
    readonly first = computed(() => (this.currentPage() - 1) * this.pageSize());

    readonly selectedItem = computed<Role | null>(() => {
        const id = this.selectedId();
        return id !== null ? (this.items().find((i) => i.id === id) ?? null) : null;
    });

    readonly hasActionColumn = computed(() => this.items().some((item) => this.menuService.hasAnyAction(item, this.rowActions())));

    readonly skeletonRows = Array.from({ length: 5 }, (_, i) => i);

    // ─── Menú de acciones (delegado al servicio de presentación) ────────
    menuFor(row: Role): MenuItem[] {
        return this.menuService.getMenuModel(row, this.rowActions());
    }

    isMenuOpen(row: Role): boolean {
        return this.menuService.isMenuOpen(row);
    }

    onMenuShow(row: Role): void {
        this.menuService.onMenuShow(row);
    }

    onMenuHide(row: Role): void {
        this.menuService.onMenuHide(row);
    }

    // ─── Selección ──────────────────────────────────────────────────────
    onRowSelect(row: Role | Role[] | undefined): void {
        if (!row || Array.isArray(row)) return;
        this.selectRow.emit(row);
    }

    // ─── Lazy load (solo emite si cambia la página o el pageSize) ───────
    onLazyLoad(event: TableLazyLoadEvent): void {
        const { page, pageSize } = getPaginated(event, this.pageSize());

        if (page !== this.currentPage() || pageSize !== this.pageSize()) {
            this.pageChange.emit({ page, pageSize });
        }
    }

    // ─── TrackBy helpers ────────────────────────────────────────────────
    readonly trackByRowId = (_: number, item: Role): number => item.id;
    readonly trackByColumnField = (_: number, col: ColumnConfig<Role>): string => col.field;
    readonly trackByIndex = (index: number): number => index;
}
