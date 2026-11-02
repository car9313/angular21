import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signalStore } from '@ngrx/signals';

import { defaultQuery, QueryParams } from '../../interfaces/query-params';
import { withQuery } from './with-query.feature';
import { withFiltersPersistence } from './with-filters-persistence.feature';

const KEY = 'test.list.filters';
const TTL_KEY = 'test.list.filters.ttl';

const TestStore = signalStore(withQuery(), withFiltersPersistence({ storageKey: KEY }));
const TtlStore = signalStore(withQuery(), withFiltersPersistence({ storageKey: TTL_KEY, ttlMs: 1000 }));

function persisted(data: QueryParams, version = 2, savedAt?: number): string {
    return JSON.stringify(savedAt === undefined ? { version, data } : { version, data, savedAt });
}

function queryWith(search: string): QueryParams {
    return { ...defaultQuery(), search: { SearchText: search, Strict: false }, pag: { Page: 2, PageSize: 10 } };
}

describe('withFiltersPersistence', () => {
    let store: InstanceType<typeof TestStore>;

    beforeEach(() => {
        sessionStorage.clear();
        vi.restoreAllMocks();
        TestBed.configureTestingModule({});
        store = TestBed.runInInjectionContext(() => new TestStore());
        TestBed.flushEffects();
    });

    it('restores a persisted query on init', () => {
        sessionStorage.setItem(KEY, persisted(queryWith('cuba')));
        store = TestBed.runInInjectionContext(() => new TestStore());

        expect(store.searchText()).toBe('cuba');
        expect(store.currentPage()).toBe(2);
        expect(store.pageSize()).toBe(10);
    });

    it('discards and removes a payload from another version', () => {
        sessionStorage.setItem(KEY, persisted(queryWith('cuba'), 1));
        store = TestBed.runInInjectionContext(() => new TestStore());

        expect(store.searchText()).toBe('');
        expect(sessionStorage.getItem(KEY)).toBeNull();
    });

    it('discards corrupt JSON', () => {
        sessionStorage.setItem(KEY, '{not-json');
        store = TestBed.runInInjectionContext(() => new TestStore());

        expect(store.searchText()).toBe('');
        expect(sessionStorage.getItem(KEY)).toBeNull();
    });

    it('discards payloads without the required query shape', () => {
        sessionStorage.setItem(KEY, JSON.stringify({ version: 2, data: { search: { SearchText: 'x', Strict: false } } }));
        store = TestBed.runInInjectionContext(() => new TestStore());

        expect(store.searchText()).toBe('');
        expect(sessionStorage.getItem(KEY)).toBeNull();
    });

    it('persists the query whenever it changes', () => {
        store.setSearch('habana');
        TestBed.flushEffects();

        const raw = JSON.parse(sessionStorage.getItem(KEY) ?? '{}') as { version: number; data: QueryParams };
        expect(raw.version).toBe(2);
        expect(raw.data.search.SearchText).toBe('habana');
    });

    it('clears the persisted payload on demand', () => {
        store.setSearch('habana');
        TestBed.flushEffects();

        (store as unknown as { _clearStorage(): void })._clearStorage();

        expect(sessionStorage.getItem(KEY)).toBeNull();
    });

    it('discards expired payloads when a TTL is configured', () => {
        sessionStorage.setItem(TTL_KEY, persisted(queryWith('cuba'), 2, Date.now() - 5_000));

        const ttlStore = TestBed.runInInjectionContext(() => new TtlStore());

        expect(ttlStore.searchText()).toBe('');
        expect(sessionStorage.getItem(TTL_KEY)).toBeNull();
    });

    it('keeps a fresh payload within the TTL', () => {
        sessionStorage.setItem(TTL_KEY, persisted(queryWith('cuba'), 2, Date.now()));

        const ttlStore = TestBed.runInInjectionContext(() => new TtlStore());

        expect(ttlStore.searchText()).toBe('cuba');
    });
});
