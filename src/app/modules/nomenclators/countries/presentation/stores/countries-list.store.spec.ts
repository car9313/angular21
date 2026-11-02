import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpResponse } from '@angular/common/http';
import { Observable, Subject, of, throwError } from 'rxjs';

import { CountriesListStore } from './countries-list.store';
import { CountryRepository } from '@/app/modules/nomenclators/countries/infrastructure/http/country-repository';
import { Country } from '@/app/modules/nomenclators/countries/domain/country';

const CUBA: Country = { id: 1, name: 'Cuba', code: 'CU', active: true };

const PAGE = {
    objects: [CUBA],
    meta: { currentPage: 1, nextPage: null, prevPage: null, totalPage: 1, totalCount: 1 }
};

function repositoryStub() {
    return {
        list: vi.fn(() => of(PAGE)),
        getById: vi.fn(() => of(CUBA)),
        create: vi.fn(() => of(CUBA)),
        update: vi.fn(() => of(CUBA)),
        activate: vi.fn<() => Observable<HttpResponse<void>>>(() => of(new HttpResponse<void>())),
        deactivate: vi.fn<() => Observable<HttpResponse<void>>>(() => of(new HttpResponse<void>())),
        delete: vi.fn<() => Observable<void>>(() => of<void>(undefined))
    };
}

async function settle(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
}

describe('CountriesListStore', () => {
    let repository: ReturnType<typeof repositoryStub>;
    let store: InstanceType<typeof CountriesListStore>;

    beforeEach(async () => {
        repository = repositoryStub();
        TestBed.configureTestingModule({
            providers: [{ provide: CountryRepository, useValue: repository }]
        });
        TestBed.runInInjectionContext(() => {
            store = new CountriesListStore();
        });
        store.load();
        await settle();
    });

    it('updates the entity only after the backend confirms deactivation', () => {
        store.setActive(CUBA, false).subscribe();

        expect(repository.deactivate).toHaveBeenCalledWith('CU');
        expect(store.entities()[0].active).toBe(false);
        expect(store.isPending('CU')).toBe(false);
    });

    it('activates through the activate endpoint using the country code', () => {
        store.setActive(CUBA, true).subscribe();

        expect(repository.activate).toHaveBeenCalledWith('CU');
        expect(store.entities()[0].active).toBe(true);
    });

    it('keeps the current state while the request is in flight', () => {
        const pending = new Subject<HttpResponse<void>>();
        repository.deactivate.mockReturnValue(pending.asObservable());

        store.setActive(CUBA, false).subscribe();

        expect(store.entities()[0].active).toBe(true);
        expect(store.isPending('CU')).toBe(true);

        pending.next(new HttpResponse<void>());
        pending.complete();

        expect(store.entities()[0].active).toBe(false);
        expect(store.isPending('CU')).toBe(false);
    });

    it('leaves the entity untouched and clears the pending key when the request fails', () => {
        repository.deactivate.mockReturnValue(throwError(() => new Error('network down')));

        let received: unknown;
        store.setActive(CUBA, false).subscribe({ error: (error: unknown) => (received = error) });

        expect(received).toBeInstanceOf(Error);
        expect(store.entities()[0].active).toBe(true);
        expect(store.isPending('CU')).toBe(false);
    });

    it('ignores a second toggle for a code already in flight', () => {
        const pending = new Subject<HttpResponse<void>>();
        repository.deactivate.mockReturnValue(pending.asObservable());

        store.setActive(CUBA, false).subscribe();
        expect(store.isPending('CU')).toBe(true);

        let secondCompleted = false;
        store.setActive(CUBA, false).subscribe({ complete: () => (secondCompleted = true) });

        expect(secondCompleted).toBe(true);
        expect(repository.deactivate).toHaveBeenCalledTimes(1);

        pending.next(new HttpResponse<void>());
        pending.complete();

        expect(store.isPending('CU')).toBe(false);
    });

    it('creates and updates with the domain payload, tracking saving', async () => {
        expect(store.saving()).toBe(false);

        await new Promise<void>((resolve) => store.createAndReload({ name: 'España', code: 'ES' }).subscribe({ complete: () => resolve() }));
        expect(repository.create).toHaveBeenCalledWith({ name: 'España', code: 'ES' });
        expect(store.saving()).toBe(false);

        await new Promise<void>((resolve) => store.updateAndReload('CU', { name: 'Cuba', code: 'CU' }).subscribe({ complete: () => resolve() }));
        expect(repository.update).toHaveBeenCalledWith('CU', { name: 'Cuba', code: 'CU' });
        expect(store.saving()).toBe(false);
    });

    it('opens add, edit and detail modes with the right selection', () => {
        store.openAdd();
        expect(store.modalMode()).toBe('add');
        expect(store.selectedId()).toBeNull();

        store.openEdit(CUBA);
        expect(store.modalMode()).toBe('edit');
        expect(store.selectedItem()).toEqual(CUBA);

        store.openDetail(CUBA);
        expect(store.modalMode()).toBe('detail');
        expect(store.selectedId()).toBe('CU');

        store.closeModalAndClearSelection();
        expect(store.modalMode()).toBeNull();
        expect(store.selectedId()).toBeNull();
    });
});
