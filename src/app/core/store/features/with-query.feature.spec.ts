import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signalStore } from '@ngrx/signals';

import { DEFAULT_QUERY, withQuery } from './with-query.feature';

const TestStore = signalStore(withQuery());

describe('withQuery', () => {
    let store: InstanceType<typeof TestStore>;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        store = TestBed.runInInjectionContext(() => new TestStore());
    });

    it('starts with the default query and no active filters', () => {
        expect(store.query()).toEqual(DEFAULT_QUERY);
        expect(store.currentPage()).toBe(1);
        expect(store.pageSize()).toBe(5);
        expect(store.searchText()).toBe('');
        expect(store.hasActiveFilters()).toBe(false);
    });

    it('changes the page without touching the rest of the query', () => {
        store.setPage(4);

        expect(store.currentPage()).toBe(4);
        expect(store.query().pag.PageSize).toBe(5);
    });

    it('resets to page 1 when the page size changes', () => {
        store.setPage(3);
        store.setPageSize(20);

        expect(store.currentPage()).toBe(1);
        expect(store.pageSize()).toBe(20);
    });

    it('resets to page 1 and disables strict search when searching', () => {
        store.setPage(3);
        store.setSearch('cuba');

        expect(store.searchText()).toBe('cuba');
        expect(store.query().search.Strict).toBe(false);
        expect(store.currentPage()).toBe(1);
        expect(store.hasActiveFilters()).toBe(true);
    });

    it('resets to page 1 when filters or sort change', () => {
        store.setPage(3);
        store.setFilters([{ PropertyName: 'name', PropertyValue: 'Cuba' }]);
        expect(store.currentPage()).toBe(1);

        store.setPage(3);
        store.setSort([{ SortBy: 'name', Ascending: true }]);
        expect(store.currentPage()).toBe(1);
        expect(store.query().sort).toEqual([{ SortBy: 'name', Ascending: true }]);
    });

    it('patches the query partially without resetting the page', () => {
        store.setSearch('cuba');
        store.setPage(3);

        store.patchQuery({ pag: { PageSize: 10 } });

        expect(store.currentPage()).toBe(3);
        expect(store.pageSize()).toBe(10);
        expect(store.searchText()).toBe('cuba');
    });

    it('restores the defaults with clearQueryParams', () => {
        store.setSearch('cuba');
        store.setSort([{ SortBy: 'name', Ascending: true }]);
        store.clearQueryParams();

        expect(store.query()).toEqual(DEFAULT_QUERY);
    });
});
