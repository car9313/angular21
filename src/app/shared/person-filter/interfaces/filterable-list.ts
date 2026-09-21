// core/interfaces/filterable-data-source.ts
import { Signal } from '@angular/core';
import { PaginationMeta } from '../../../core/interfaces/paginated-response';
import { QueryParams } from '../../../core/interfaces/query-params';

export interface FilterableDataSource {
    // Estado
    readonly items: Signal<unknown[]>;
    readonly loading: Signal<boolean>;
    readonly meta: Signal<PaginationMeta>;
    readonly query: Signal<QueryParams>;

    // Acciones
    init(): void;
    reload(): void;
    setPage(page: number): void;
    setPageSize(size: number): void;
    setFilters(filters: QueryParams['filter']): void;
    clearQueryParams(): void;
}
