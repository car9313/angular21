import { describe, it, expect } from 'vitest';
import { TableLazyLoadEvent } from 'primeng/table';

import { getFirst, getPaginated, getRows, getTotal, loadLazy, trackByColumnField } from './table-lazy-load.helper';
import { defaultQuery, QueryParams, Sort } from '../interfaces/query-params';
import { PaginatedResponse } from '../interfaces/paginated-response';
import { ColumnConfig } from '../interfaces/column-config';

const META: PaginatedResponse<unknown>['meta'] = {
    currentPage: 2,
    nextPage: 3,
    prevPage: 1,
    totalPage: 5,
    totalCount: 42
};

describe('table-lazy-load.helper', () => {
    describe('getPaginated', () => {
        it('derives the 1-based page from first and rows', () => {
            expect(getPaginated({ first: 0, rows: 10 } as TableLazyLoadEvent, 5)).toEqual({ page: 1, pageSize: 10, sort: [] });
            expect(getPaginated({ first: 20, rows: 10 } as TableLazyLoadEvent, 5)).toEqual({ page: 3, pageSize: 10, sort: [] });
        });

        it('falls back to the default page size when rows is missing', () => {
            expect(getPaginated({ first: 5 } as TableLazyLoadEvent, 5)).toEqual({ page: 2, pageSize: 5, sort: [] });
        });

        it('maps multi-sort before single sort', () => {
            const event = {
                first: 0,
                rows: 5,
                sortField: 'name',
                sortOrder: 1,
                multiSortMeta: [
                    { field: 'code', order: 1 },
                    { field: 'name', order: -1 }
                ]
            } as TableLazyLoadEvent;

            expect(getPaginated(event, 5).sort).toEqual([
                { SortBy: 'code', Ascending: true },
                { SortBy: 'name', Ascending: false }
            ]);
        });

        it('maps a single descending sort', () => {
            expect(getPaginated({ first: 0, rows: 5, sortField: 'name', sortOrder: -1 } as TableLazyLoadEvent, 5).sort).toEqual([{ SortBy: 'name', Ascending: false }]);
        });
    });

    describe('loadLazy', () => {
        const query: QueryParams = { ...defaultQuery(), pag: { Page: 2, PageSize: 10 } };
        const sort: Sort[] = [{ SortBy: 'name', Ascending: true }];

        it('reports a page change against the server meta', () => {
            const result = loadLazy({ first: 20, rows: 10 } as TableLazyLoadEvent, query, META, sort);

            expect(result.page).toBe(3);
            expect(result.pageChanged).toBe(true);
            expect(result.pageSizeChanged).toBe(false);
        });

        it('reports a page size change against the current query', () => {
            const result = loadLazy({ first: 0, rows: 20 } as TableLazyLoadEvent, query, META, sort);

            expect(result.pageSize).toBe(20);
            expect(result.pageSizeChanged).toBe(true);
            expect(result.page).toBe(1);
        });

        it('clears the sort when PrimeNG sends an empty sort state', () => {
            const result = loadLazy({ first: 0, rows: 10 } as TableLazyLoadEvent, query, META, sort);

            expect(result.sort).toEqual([]);
            expect(result.sortChanged).toBe(true);
        });

        it('keeps the incoming sort when it matches the current one', () => {
            const result = loadLazy({ first: 0, rows: 10, sortField: 'name', sortOrder: 1 } as TableLazyLoadEvent, query, META, sort);

            expect(result.sort).toEqual(sort);
            expect(result.sortChanged).toBe(false);
        });
    });

    it('exposes pagination helpers for the table bindings', () => {
        const query = { ...defaultQuery(), pag: { Page: 2, PageSize: 10 } };

        expect(getRows(query)).toBe(10);
        expect(getTotal(META)).toBe(42);
        expect(getFirst(META, query)).toBe(10);
    });

    it('tracks columns by field with header fallback', () => {
        expect(trackByColumnField(0, { field: 'name', header: 'Nombre' } as ColumnConfig<unknown>)).toBe('name');
        expect(trackByColumnField(1, { header: 'Activo' } as ColumnConfig<unknown>)).toBe('Activo');
    });
});
