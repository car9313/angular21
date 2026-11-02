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

import { EmptyStateComponent } from '@/app/shared/components/empty-state/empty-state.component';
import { User } from '@/app/modules/security/users/domain/user';
import { TableActionMenuService } from '@/app/core/services/table-action-menu';
import { TableAction } from '@/app/core/interfaces/table-action';
import { ColumnConfig } from '@/app/core/interfaces/column-config';
import { getPaginated } from '@/app/core/helpers/table-lazy-load.helper';
import { PageChangeEvent } from '@/app/core/interfaces/page-change-event';


@Component({
    selector: 'app-user-table',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, MenuModule, InputTextModule, Skeleton, Tooltip, EmptyStateComponent],
    templateUrl: './user-table.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TableActionMenuService]
})
export class UserTableComponent {
    // ─── Inputs ─────────────────────────────────────────────────────────
    readonly items = input.required<User[]>();
    readonly columns = input.required<ColumnConfig<User>[]>();
    readonly rowActions = input<TableAction<User>[]>([]);
    readonly selectedId = input<number | null>(null);
    readonly loading = input(false);
    readonly error = input<string | null>(null);
    readonly totalRecords = input(0);
    readonly currentPage = input(1);
    readonly pageSize = input(10);
    readonly rowsPerPageOptions = input([5, 10, 20]);
    /** Búsqueda activa: permite distinguir "sin resultados" de "sin datos". */
    readonly searchText = input('');

    // ─── Outputs ────────────────────────────────────────────────────────
    readonly selectRow = output<User>();
    readonly pageChange = output<PageChangeEvent>();

    // ─── Dependencias de presentación (NO del store) ────────────────────
    private readonly menuService = inject(TableActionMenuService<User>);

    // ─── Derivados ──────────────────────────────────────────────────────
    readonly first = computed(() => (this.currentPage() - 1) * this.pageSize());

    readonly selectedItem = computed<User | null>(() => {
        const id = this.selectedId();
        return id !== null ? (this.items().find((i) => i.id === id) ?? null) : null;
    });

    readonly hasActionColumn = computed(() => this.items().some((item) => this.menuService.hasAnyAction(item, this.rowActions())));

    /**
     * El selector de filas por página solo se muestra cuando hay más de una
     * página posible (misma regla que la tabla de roles).
     */
    readonly visibleRowsPerPageOptions = computed<number[] | undefined>(() =>
        this.totalRecords() > this.pageSize() ? this.rowsPerPageOptions() : undefined
    );

    /** Copy del empty state cuando el filtro es una búsqueda sin coincidencias. */
    readonly emptySearchDescription = computed(
        () => `No se encontraron usuarios que coincidan con «${this.searchText()}».`
    );

    readonly skeletonRows = Array.from({ length: 5 }, (_, i) => i);

    // ─── Menú de acciones (delegado al servicio de presentación) ────────
    menuFor(row: User): MenuItem[] {
        return this.menuService.getMenuModel(row, this.rowActions());
    }

    isMenuOpen(row: User): boolean {
        return this.menuService.isMenuOpen(row);
    }

    onMenuShow(row: User): void {
        this.menuService.onMenuShow(row);
    }

    onMenuHide(row: User): void {
        this.menuService.onMenuHide(row);
    }

    // ─── Selección ──────────────────────────────────────────────────────
    onRowSelect(row: User | User[] | undefined): void {
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
    readonly trackByRowId = (_: number, item: User): number => item.id;
    readonly trackByColumnField = (_: number, col: ColumnConfig<User>): string => col.field;
    readonly trackByIndex = (index: number): number => index;
}
