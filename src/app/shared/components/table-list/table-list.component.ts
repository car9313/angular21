import { ChangeDetectionStrategy, Component, contentChild, input, TemplateRef, computed } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { TableLazyLoadEvent } from 'primeng/table';
import { BaseTableComponent } from '../base-table/base-table.component';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { TableListDataSource } from './table-list-data-source';
import { loadLazy } from '../../../core/helpers/table-lazy-load.helper';

/**
 * Listado de personas reutilizable (por contrato).
 *
 * Recibe por @Input un `TableListDataSource` (normalmente un facade). No hace
 * `inject` de ningún facade concreto: es la página quien le pasa `[dataSource]="facade"`.
 *
 * Traduce los `@Output` de la tabla (lazy load) a llamadas del contrato
 * (setPage/setPageSize) y proyecta al `app-base-table` con su estado.
 * Las acciones/columnas específicas se inyectan por proyección de contenido
 * (#body/#header/#expandedrow/#emptymessage).
 */
@Component({
    selector: 'app-table-list',
    imports: [BaseTableComponent, NgTemplateOutlet, EmptyStateComponent],
    templateUrl: './table-list.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableListComponent {
    readonly dataSource = input.required<TableListDataSource>();
    readonly dataKey = input('identityNumber');
    readonly expandedRowKeys = input<Record<string, boolean>>({});

    // Apariencia (passthrough a app-base-table)
    readonly stripedRows = input<boolean>(false);
    readonly showCurrentPageReport = input<boolean>(false);
    readonly currentPageReportTemplate = input<string>('Mostrando del {first} al {last} de {totalRecords} elementos');
    readonly loadingSkeleton = input<boolean>(false);

    readonly items = computed(() => this.dataSource().items());
    readonly loading = computed(() => this.dataSource().loading());
    readonly totalRecords = computed(() => this.dataSource().meta().totalCount);
    readonly pageSize = computed(() => this.dataSource().query().pag.PageSize);
    readonly first = computed(() => (this.dataSource().meta().currentPage - 1) * this.dataSource().query().pag.PageSize);

    onLazyLoad(event: TableLazyLoadEvent): void {
        const ds = this.dataSource();
        const result = loadLazy(event, ds.query(), ds.meta());
        if (result.pageChanged) ds.setPage(result.page);
        if (result.pageSizeChanged) ds.setPageSize(result.pageSize);
    }

    // Plantillas proyectadas desde el consumidor
    readonly headerTemplate = contentChild<TemplateRef<unknown>>('headertpl');
    readonly bodyTemplate = contentChild<TemplateRef<unknown>>('bodytpl');
    readonly expandedRowTemplate = contentChild<TemplateRef<unknown>>('expandedrowtpl');
    readonly emptyMessageTemplate = contentChild<TemplateRef<unknown>>('emptymessagetpl');
}
