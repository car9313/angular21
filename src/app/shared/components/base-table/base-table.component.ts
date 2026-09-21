import { ChangeDetectionStrategy, Component, contentChild, input, output, TemplateRef, ViewChild } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { TableLazyLoadEvent, TableModule, Table } from 'primeng/table';
import { Skeleton } from 'primeng/skeleton';
import { EmptyStateComponent } from '../empty-state/empty-state.component';

@Component({
    selector: 'app-base-table',
    imports: [TableModule, NgTemplateOutlet, EmptyStateComponent, Skeleton],
    templateUrl: './base-table.component.html',
    styleUrl: './base-table.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BaseTableComponent {
    // ─── Estado de lista ────────────────────────────────────────────────────
    readonly items = input.required<unknown[]>();
    readonly loading = input<boolean>(false);
    readonly totalRecords = input<number>(0);
    readonly pageSize = input<number>(10);
    readonly first = input<number>(0);
    readonly paginated = input<boolean>(true);
    readonly rowsPerPageOptions = input<number[]>([5, 10, 20]);
    readonly dataKey = input<string>('identityNumber');
    readonly expandedRowKeys = input<Record<string, boolean>>({});

    // ─── Apariencia ──────────────────────────────────────────────────────────
    readonly stripedRows = input<boolean>(false);
    readonly showCurrentPageReport = input<boolean>(false);
    readonly currentPageReportTemplate = input<string>('Mostrando del {first} al {last} de {totalRecords} elementos');
    readonly loadingSkeleton = input<boolean>(false);
    readonly skeletonRows = Array(5).fill(0);
    readonly skeletonCells = Array(8).fill(0);

    // ─── Empty state (solo si no se proyecta #emptymessage) ─────────────────
    readonly emptyTitle = input<string>('No hay registros');
    readonly emptyDescription = input<string>('La lista está vacía.');

    // ─── Eventos ────────────────────────────────────────────────────────────
    readonly lazyLoad = output<TableLazyLoadEvent>();

    // ─── Plantillas proyectadas (opcionales) ────────────────────────────────
    readonly headerTemplate = contentChild<TemplateRef<unknown>>('header');
    readonly bodyTemplate = contentChild<TemplateRef<unknown>>('body');
    readonly expandedRowTemplate = contentChild<TemplateRef<unknown>>('expandedrow');
    readonly emptyMessageTemplate = contentChild<TemplateRef<unknown>>('emptymessage');

    // ─── Referencia a la tabla de PrimeNG para pasar a las plantillas ───────
    @ViewChild(Table) table!: Table;
}
