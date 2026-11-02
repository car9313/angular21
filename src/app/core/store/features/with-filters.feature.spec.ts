import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signalStore } from '@ngrx/signals';

import { withQuery } from './with-query.feature';
import { withFilters } from './with-filters.feature';

const TestStore = signalStore(withQuery(), withFilters());

describe('withFilters', () => {
    let store: InstanceType<typeof TestStore>;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        store = TestBed.runInInjectionContext(() => new TestStore());
    });

    it('starts without filters', () => {
        expect(store.hasActiveFilters()).toBe(false);
        expect(store.filtersAsObject()).toEqual({});
    });

    it('builds filters from form values and resets to page 1', () => {
        store.setPage(4);
        store.applyFilters({ name: 'Cuba', code: '', active: true });

        expect(store.query().filter).toEqual([
            { PropertyName: 'name', PropertyValue: 'Cuba' },
            { PropertyName: 'active', PropertyValue: 'true' }
        ]);
        expect(store.currentPage()).toBe(1);
        expect(store.hasActiveFilters()).toBe(true);
        expect(store.filtersAsObject()).toEqual({ name: 'Cuba', active: 'true' });
    });

    it('clears filters, search and pagination together', () => {
        store.applyFilters({ name: 'Cuba' });
        store.setSearch('habana');
        store.setPage(3);

        store.clearFilters();

        expect(store.query().filter).toEqual([]);
        expect(store.searchText()).toBe('');
        expect(store.currentPage()).toBe(1);
        expect(store.hasActiveFilters()).toBe(false);
    });
});
