import { TableLazyLoadEvent } from 'primeng/table';

import { ColumnConfig } from '../interfaces/column-config';
import { PaginatedResponse } from '../interfaces/paginated-response';
import { QueryParams, Sort } from '../interfaces/query-params';

/**
 * Normalized values extracted from a PrimeNG lazy table event, ready for the
 * .NET query contract (`QueryParams`).
 */
export interface LoadParams {
    page: number;
    pageSize: number;
    sort: Sort[];
}

export interface LazyResult {
    page: number;
    pageSize: number;
    sort: Sort[];
    pageChanged: boolean;
    pageSizeChanged: boolean;
    sortChanged: boolean;
}

/**
 * Translates a PrimeNG `TableLazyLoadEvent` into backend query values and
 * reports what actually changed, so a table can skip redundant refetches.
 *
 * Ported from devueltos_ui. The sort branch matters only once columns become
 * server-sortable; the pagination branch is already used by every lazy table.
 */
export function loadLazy<T>(event: TableLazyLoadEvent, queryParams: QueryParams, meta: PaginatedResponse<T>['meta'], currentSort?: Sort[]): LazyResult {
    const effectiveSort = currentSort ?? [];
    const { page, pageSize, sort } = getPaginated(event, queryParams.pag.PageSize);

    const pageChanged = page !== meta.currentPage;
    const pageSizeChanged = pageSize !== queryParams.pag.PageSize;
    const sortChanged = !areSortsEqual(sort, effectiveSort);

    // PrimeNG fires an event with empty sort state when an active column-sort
    // UI is cleared: fall back to no sort instead of keeping the stale one.
    if (!event.sortField && !event.multiSortMeta && effectiveSort.length > 0) {
        return {
            page,
            pageSize,
            sort: [],
            pageChanged,
            pageSizeChanged,
            sortChanged: true
        };
    }

    return { page, pageSize, sort, pageChanged, pageSizeChanged, sortChanged };
}

export function getPaginated(event: TableLazyLoadEvent, defaultPageSize: number): LoadParams {
    const pageSize = event.rows ?? defaultPageSize;
    const page = Math.floor((event.first ?? 0) / pageSize) + 1;

    let sort: Sort[] = [];

    if (event.multiSortMeta) {
        sort = event.multiSortMeta.map((m) => ({
            SortBy: m.field as string,
            Ascending: m.order === 1
        }));
    } else if (event.sortField) {
        sort = [
            {
                SortBy: event.sortField as string,
                Ascending: event.sortOrder === 1
            }
        ];
    }

    return { page, pageSize, sort };
}

export function getRows(queryParams: QueryParams): number {
    return queryParams.pag.PageSize;
}

export function getTotal<T>(meta: PaginatedResponse<T>['meta']): number {
    return meta.totalCount;
}

export function getFirst<T>(meta: PaginatedResponse<T>['meta'], queryParams: QueryParams): number {
    return (meta.currentPage - 1) * queryParams.pag.PageSize;
}

export function trackByColumnField<T>(_index: number, col: ColumnConfig<T>): string {
    return String(col.field ?? col.header ?? '');
}

function areSortsEqual(a: Sort[], b: Sort[]): boolean {
    if (a.length !== b.length) return false;

    return a.every((item, index) => {
        const other = b[index];
        return item.SortBy === other.SortBy && item.Ascending === other.Ascending;
    });
}
