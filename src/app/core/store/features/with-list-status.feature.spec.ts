import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signalStore } from '@ngrx/signals';

import { DEFAULT_META, withListStatus } from './with-list-status.feature';
import { PaginationMeta } from '../../interfaces/paginated-response';

const TestStore = signalStore(withListStatus());

interface ListStatusInternals {
    _setLoading(loading: boolean): void;
    _setError(message: string | null): void;
    _setMeta(meta: PaginationMeta): void;
}

describe('withListStatus', () => {
    let store: InstanceType<typeof TestStore>;
    let internals: ListStatusInternals;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        store = TestBed.runInInjectionContext(() => new TestStore());
        internals = store as unknown as ListStatusInternals;
    });

    it('starts idle with the default meta', () => {
        expect(store.loading()).toBe(false);
        expect(store.error()).toBeNull();
        expect(store.meta()).toEqual(DEFAULT_META);
    });

    it('starts loading and clears the previous error', () => {
        internals._setError('falló');
        internals._setLoading(true);

        expect(store.loading()).toBe(true);
        expect(store.error()).toBeNull();
    });

    it('keeps the error when loading stops', () => {
        internals._setError('falló');
        internals._setLoading(false);

        expect(store.loading()).toBe(false);
        expect(store.error()).toBe('falló');
    });

    it('sets an error and stops loading', () => {
        internals._setLoading(true);
        internals._setError('No se pudo cargar');

        expect(store.error()).toBe('No se pudo cargar');
        expect(store.loading()).toBe(false);
    });

    it('replaces the pagination meta', () => {
        internals._setMeta({ currentPage: 3, nextPage: 4, prevPage: 2, totalPage: 9, totalCount: 85 });

        expect(store.meta().currentPage).toBe(3);
        expect(store.meta().totalCount).toBe(85);
    });
});
