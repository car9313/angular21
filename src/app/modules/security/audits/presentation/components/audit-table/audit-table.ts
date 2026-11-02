import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { ColumnConfig } from '@/app/core/interfaces/column-config';
import { TableAction } from '@/app/core/interfaces/table-action';
import { TableActionMenuService } from '@/app/core/services/table-action-menu';
import { MenuItem } from 'primeng/api';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { getPaginated } from '@/app/core/helpers/table-lazy-load.helper';
import { Audit } from '@/app/modules/security/audits/domain/audit';
import { NgClass } from '@angular/common';
import { Menu } from 'primeng/menu';
import { Button } from 'primeng/button';
import { Skeleton } from 'primeng/skeleton';
import { EmptyStateComponent } from '@/app/shared/components/empty-state/empty-state.component';
import { PageChangeEvent } from '@/app/core/interfaces/page-change-event';


@Component({
    selector: 'app-audit-table',
    imports: [TableModule, NgClass, Menu, Button, Skeleton, EmptyStateComponent],
    templateUrl: './audit-table.html',
    styleUrl: './audit-table.scss',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TableActionMenuService]
})
export class AuditTable {
    readonly items = input.required<Audit[]>();
    readonly columns = input.required<ColumnConfig<Audit>[]>();
    readonly rowActions = input<TableAction<Audit>[]>([]);
    readonly selectedId = input<string | null>(null);
    readonly loading = input(false);
    readonly error = input<string | null>(null);
    readonly totalRecords = input(0);
    readonly currentPage = input(1);
    readonly pageSize = input(10);
    readonly rowsPerPageOptions = input([5, 10, 20]);
    /** Búsqueda activa: permite distinguir "sin resultados" de "sin datos". */
    readonly searchText = input('');

    // ─── Outputs ────────────────────────────────────────────────────────
    readonly selectRow = output<Audit>();
    readonly edit = output<Audit>();
    readonly view = output<Audit>();
    readonly remove = output<Audit>();
    readonly pageChange = output<PageChangeEvent>();

    // ─── Dependencias de presentación (NO del store) ────────────────────
    private readonly menuService = inject(TableActionMenuService<Audit>);

    // ─── Derivados ──────────────────────────────────────────────────────
    readonly first = computed(() => (this.currentPage() - 1) * this.pageSize());

    readonly hasActionColumn = computed(() => this.items().some((item) => this.menuService.hasAnyAction(item, this.rowActions())));

    /**
     * El selector de filas por página solo se muestra cuando hay más de una
     * página posible. Si todo cabe en la página actual (p. ej. 7 registros con
     * pageSize 10), mostrar "10" junto a "Mostrando del 1 al 7 de 7" confunde.
     * `undefined` oculta el dropdown (PrimeNG lo renderiza con *ngIf="rowsPerPageOptions").
     */
    readonly visibleRowsPerPageOptions = computed<number[] | undefined>(() => (this.totalRecords() > this.pageSize() ? this.rowsPerPageOptions() : undefined));

    /** Copy del empty state cuando el filtro es una búsqueda sin coincidencias. */
    readonly emptySearchDescription = computed(() => `No se encontraron auditorías que coincidan con «${this.searchText()}».`);

    readonly skeletonRows = Array.from({ length: 5 }, (_, i) => i);

    // ─── Menú de acciones (delegado al servicio de presentación) ────────
    menuFor(row: Audit): MenuItem[] {
        return this.menuService.getMenuModel(row, this.rowActions());
    }

    isMenuOpen(row: Audit): boolean {
        return this.menuService.isMenuOpen(row);
    }

    onMenuShow(row: Audit): void {
        this.menuService.onMenuShow(row);
    }

    onMenuHide(row: Audit): void {
        this.menuService.onMenuHide(row);
    }

    // ─── Selección ──────────────────────────────────────────────────────
    onRowSelect(row: Audit | Audit[] | undefined): void {
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
}
