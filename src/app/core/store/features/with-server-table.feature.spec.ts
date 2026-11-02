import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Observable, Subject, throwError } from 'rxjs';
import { signalStore } from '@ngrx/signals';
import { inject } from '@angular/core';

import { withServerTable } from './with-server-table.feature';
import { withServerTableWrites } from './with-server-table-writes.feature';
import { QueryParams } from '../../interfaces/query-params';
import { PaginatedResponse, PaginationMeta } from '../../interfaces/paginated-response';

interface Thing {
    id: number;
    name: string;
}

/** Repositorio de prueba: expone lectura + escritura (para testing de ambas features). */
class TestRepository {
    list = vi.fn<(q: QueryParams) => Observable<PaginatedResponse<Thing>>>();
    create = vi.fn<(...args: unknown[]) => Observable<Thing>>();
    update = vi.fn<(id: number, ...args: unknown[]) => Observable<Thing>>();
    delete = vi.fn<(id: number) => Observable<void>>();
}

const TestStore = signalStore(
    withServerTable<Thing, number>({
        repository: () => inject(TestRepository),
        errorMessage: 'No se pudieron cargar.',
        selectId: 'id'
    }),
    withServerTableWrites<Thing, number>({
        repository: () => inject(TestRepository)
    })
);

// ─── Helpers ────────────────────────────────────────────────────────────────
function meta(overrides: Partial<PaginationMeta> = {}): PaginationMeta {
    return {
        currentPage: 1,
        nextPage: null,
        prevPage: null,
        totalPage: 1,
        totalCount: 0,
        ...overrides
    };
}

function page(items: Thing[], overrides: Partial<PaginationMeta> = {}): PaginatedResponse<Thing> {
    return { objects: items, meta: meta(overrides) };
}

/** Observable que resuelve en un microtask: permite asertar el estado "en vuelo". */
function asyncValue<T>(value: T): Observable<T> {
    return new Observable((subscriber) => {
        queueMicrotask(() => {
            subscriber.next(value);
            subscriber.complete();
        });
    });
}

async function settle(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
}

// ─── Specs ──────────────────────────────────────────────────────────────────
describe('withServerTable + withServerTableWrites', () => {
    let repository: TestRepository;
    let store: InstanceType<typeof TestStore>;

    beforeEach(() => {
        repository = new TestRepository();
        TestBed.configureTestingModule({
            providers: [{ provide: TestRepository, useValue: repository }]
        });
        store = TestBed.runInInjectionContext(() => new TestStore());
    });

    it('starts empty and idle', () => {
        expect(store.entities()).toEqual([]);
        expect(store.isEmpty()).toBe(true);
        expect(store.loading()).toBe(false);
        expect(store.error()).toBeNull();
        expect(store.saving()).toBe(false);
        expect(store.selectedId()).toBeNull();
        expect(store.selectedItem()).toBeNull();
        expect(store.meta().totalCount).toBe(0);
    });

    it('loads a page into entities and meta, tracking the in-flight flag', async () => {
        repository.list.mockImplementation(() => asyncValue(page([{ id: 1, name: 'A' }], { totalCount: 1 })));

        store.load();
        expect(store.loading()).toBe(true);

        await settle();

        expect(store.loading()).toBe(false);
        expect(store.entities()).toEqual([{ id: 1, name: 'A' }]);
        expect(store.isEmpty()).toBe(false);
        expect(store.meta().totalCount).toBe(1);
        expect(store.error()).toBeNull();
    });

    it('drops stale responses — only the latest query wins', async () => {
        const subj1 = new Subject<PaginatedResponse<Thing>>();
        const subj2 = new Subject<PaginatedResponse<Thing>>();
        repository.list.mockReturnValueOnce(subj1).mockReturnValueOnce(subj2);

        store.setPage(1);
        store.load();
        store.setPage(2);
        store.load();
        expect(repository.list).toHaveBeenCalledTimes(2);
        expect(repository.list.mock.calls[0][0].pag.Page).toBe(1);
        expect(repository.list.mock.calls[1][0].pag.Page).toBe(2);

        // La query más nueva (página 2) es la única que debe aplicar.
        subj2.next(page([{ id: 2, name: 'B' }], { currentPage: 2 }));
        subj2.complete();
        await settle();
        expect(store.entities().map((t) => t.id)).toEqual([2]);

        // Respuesta tardía de la primera query (abandonada por switchMap) se ignora.
        subj1.next(page([{ id: 1, name: 'A' }]));
        subj1.complete();
        await settle();
        expect(store.entities().map((t) => t.id)).toEqual([2]);
    });

    it('applyQueryAndReload patches and fires exactly one request without resetting the page', async () => {
        repository.list.mockImplementation(() => asyncValue(page([])));

        store.setPage(3);
        store.load();
        await settle();
        repository.list.mockClear();

        store.applyQueryAndReload({ pag: { PageSize: 25 } });
        await settle();

        expect(repository.list).toHaveBeenCalledTimes(1);
        const request = repository.list.mock.calls[0][0];
        expect(request.pag.Page).toBe(3);
        expect(request.pag.PageSize).toBe(25);
        expect(store.currentPage()).toBe(3);
        expect(store.pageSize()).toBe(25);
        expect(store.searchText()).toBe('');
    });

    it('applyQueryAndReload never resets the page and can restore search without side effects', async () => {
        repository.list.mockImplementation(() => asyncValue(page([])));

        store.applyQueryAndReload({ search: { SearchText: 'cuba' }, pag: { Page: 2 }, sort: [{ SortBy: 'name', Ascending: true }] });
        await settle();

        expect(repository.list).toHaveBeenCalledTimes(1);
        const request = repository.list.mock.calls[0][0];
        expect(request.pag.Page).toBe(2);
        expect(request.search).toEqual({ SearchText: 'cuba', Strict: false });
        expect(request.sort).toEqual([{ SortBy: 'name', Ascending: true }]);
        // El patch no consume base por accidente: filter sigue en su default.
        expect(request.filter).toEqual([]);
    });

    it('setSortAndReload replaces sort, resets to page 1 and reloads once', async () => {
        repository.list.mockImplementation(() => asyncValue(page([])));

        store.setPage(4);
        store.load();
        await settle();
        repository.list.mockClear();

        store.setSortAndReload([{ SortBy: 'name', Ascending: false }]);
        await settle();

        expect(repository.list).toHaveBeenCalledTimes(1);
        const request = repository.list.mock.calls[0][0];
        expect(request.sort).toEqual([{ SortBy: 'name', Ascending: false }]);
        expect(request.pag.Page).toBe(1);
        expect(store.currentPage()).toBe(1);
    });

    it('applyQueryAndReload cancels an in-flight load — only the patched query wins', async () => {
        const subj1 = new Subject<PaginatedResponse<Thing>>();
        const subj2 = new Subject<PaginatedResponse<Thing>>();
        repository.list.mockReturnValueOnce(subj1).mockReturnValueOnce(subj2);

        store.load();
        store.applyQueryAndReload({ pag: { Page: 2, PageSize: 15 } });
        expect(repository.list).toHaveBeenCalledTimes(2);
        expect(repository.list.mock.calls[1][0].pag).toEqual({ Page: 2, PageSize: 15 });

        subj2.next(page([{ id: 2, name: 'B' }], { currentPage: 2 }));
        subj2.complete();
        await settle();
        expect(store.entities().map((t) => t.id)).toEqual([2]);
        expect(store.currentPage()).toBe(2);

        subj1.next(page([{ id: 1, name: 'A' }]));
        subj1.complete();
        await settle();
        expect(store.entities().map((t) => t.id)).toEqual([2]);
    });

    it('sets error, clears entities and stops loading on failure', async () => {
        repository.list.mockReturnValue(throwError(() => new Error('red timeout')));

        store.load();
        await settle();

        expect(store.loading()).toBe(false);
        expect(store.error()).toBe('red timeout');
        expect(store.entities()).toEqual([]);
    });

    it('uses the config errorMessage when the error is not an Error instance', async () => {
        repository.list.mockReturnValue(throwError(() => ({ status: 500 })));

        store.load();
        await settle();

        expect(store.error()).toBe('No se pudieron cargar.');
    });

    // ─── withServerTableWrites ─────────────────────────────────────────────
    it('createAndReload writes, reloads and clears saving', async () => {
        repository.list.mockImplementation(() => asyncValue(page([{ id: 1, name: 'A' }])));
        repository.create.mockReturnValue(
            new Observable<Thing>((subscriber) => {
                expect(store.saving()).toBe(true);
                queueMicrotask(() => {
                    subscriber.next({ id: 2, name: 'B' });
                    subscriber.complete();
                });
            })
        );

        // Pre-load para tener datos previos (1 llamada a red).
        store.load();
        await settle();
        expect(repository.list).toHaveBeenCalledTimes(1);

        const result$ = store.createAndReload('B');
        const done = new Promise<void>((resolve) => result$.subscribe({ complete: () => resolve() }));
        await done;

        expect(repository.create).toHaveBeenCalledWith('B');
        // Tras escribir, la recarga volvió a la red (2ª llamada).
        expect(repository.list).toHaveBeenCalledTimes(2);
        expect(store.saving()).toBe(false);
        expect(store.entities().map((t) => t.id)).toEqual([1]);
    });

    it('clears saving also when the write fails', async () => {
        repository.create.mockReturnValue(
            new Observable<Thing>((subscriber) => {
                expect(store.saving()).toBe(true);
                queueMicrotask(() => subscriber.error(new Error('network down')));
            })
        );

        const result$ = store.createAndReload('B');
        await new Promise<void>((resolve) => result$.subscribe({ error: () => resolve() }));

        expect(store.saving()).toBe(false);
    });

    it('updateAndReload and deleteAndReload target the repository and reload', async () => {
        repository.list.mockImplementation(() => asyncValue(page([{ id: 1, name: 'A' }])));
        repository.update.mockImplementation(() => asyncValue({ id: 1, name: 'Actualizado' }));
        repository.delete.mockImplementation(() => asyncValue(undefined));

        await new Promise<void>((resolve) => store.updateAndReload(1, 'Actualizado').subscribe({ complete: () => resolve() }));
        expect(repository.update).toHaveBeenCalledWith(1, 'Actualizado');
        expect(repository.list).toHaveBeenCalledTimes(1);
        expect(store.saving()).toBe(false);

        await new Promise<void>((resolve) => store.deleteAndReload(1).subscribe({ complete: () => resolve() }));
        expect(repository.delete).toHaveBeenCalledWith(1);
        expect(repository.list).toHaveBeenCalledTimes(2);
        expect(store.saving()).toBe(false);
    });

    it('fails fast when the repository does not implement the requested action', () => {
        (repository as unknown as { create?: unknown }).create = undefined;

        expect(() => store.createAndReload('B')).toThrow('El repositorio no soporta "create"');
    });
});
