import { describe, it, expect } from 'vitest';

import { QueryParams, mergeQuery } from './query-params';

const base: QueryParams = {
    search: { SearchText: 'cuba', Strict: true },
    filter: [{ PropertyName: 'active', PropertyValue: 'true' }],
    sort: [{ SortBy: 'name', Ascending: true }],
    pag: { Page: 3, PageSize: 20 }
};

describe('mergeQuery', () => {
    it('applies a partial pag patch without touching search or filter', () => {
        const result = mergeQuery(base, { pag: { PageSize: 10 } });

        expect(result.pag).toEqual({ Page: 3, PageSize: 10 });
        expect(result.search).toEqual(base.search);
        expect(result.filter).toEqual(base.filter);
        expect(result.sort).toEqual(base.sort);
        expect(result).not.toBe(base);
    });

    it('applies a partial search patch preserving Strict', () => {
        const result = mergeQuery(base, { search: { SearchText: 'hola' } });

        expect(result.search).toEqual({ SearchText: 'hola', Strict: true });
        expect(result.pag).toEqual(base.pag);
    });

    it('never resets the page', () => {
        const result = mergeQuery(base, { search: { SearchText: 'x' }, filter: [] });

        expect(result.pag).toEqual({ Page: 3, PageSize: 20 });
    });

    it('replaces filter and sort completely when provided, keeps them when absent', () => {
        const replaced = mergeQuery(base, {
            filter: [{ PropertyName: 'code', PropertyValue: 'CU' }],
            sort: [{ SortBy: 'code', Ascending: false }]
        });

        expect(replaced.filter).toEqual([{ PropertyName: 'code', PropertyValue: 'CU' }]);
        expect(replaced.sort).toEqual([{ SortBy: 'code', Ascending: false }]);

        const untouched = mergeQuery(base, { pag: { Page: 1 } });

        expect(untouched.filter).toEqual(base.filter);
        expect(untouched.sort).toEqual(base.sort);
    });

    it('does not mutate the base query nor share replaced arrays with it', () => {
        const snapshot = JSON.stringify(base, null, 2);
        const patchFilter = [{ PropertyName: 'code', PropertyValue: 'CU' }];
        const patchPag = { PageSize: 50 };

        const result = mergeQuery(base, { filter: patchFilter, pag: patchPag });

        expect(JSON.stringify(base, null, 2)).toBe(snapshot);
        expect(result.filter).not.toBe(base.filter);
        expect(result.pag).not.toBe(base.pag);
        expect(result.pag).toEqual({ Page: 3, PageSize: 50 });
    });

    it('keeps base values for absent or explicitly undefined keys', () => {
        const result = mergeQuery(base, { filter: undefined, pag: undefined });

        expect(result.filter).toEqual(base.filter);
        expect(result.pag).toEqual(base.pag);
    });
});
