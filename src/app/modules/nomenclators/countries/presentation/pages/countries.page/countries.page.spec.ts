import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Observable, of } from 'rxjs';
import { MessageService } from 'primeng/api';

import { CountriesPage } from './countries.page';
import { CountryRepository } from '@/app/modules/nomenclators/countries/infrastructure/http/country-repository';
import { Country } from '@/app/modules/nomenclators/countries/domain/country';
import { SessionStore } from '@/app/core/store/session.store';
import { RESOURCES } from '@/app/core/constants/resources';
import { ACTIONS } from '@/app/core/constants/actions';

const CUBA: Country = { name: 'Cuba', code: 'CU', active: true };

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
        activate: vi.fn<() => Observable<void>>(() => of<void>(undefined)),
        deactivate: vi.fn<() => Observable<void>>(() => of<void>(undefined)),
        delete: vi.fn<() => Observable<void>>(() => of<void>(undefined))
    };
}

async function settle(fixture: ComponentFixture<CountriesPage>): Promise<void> {
    fixture.detectChanges();
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();
}

describe('CountriesPage', () => {
    let fixture: ComponentFixture<CountriesPage>;
    let component: CountriesPage;
    let repository: ReturnType<typeof repositoryStub>;
    let session: InstanceType<typeof SessionStore>;

    beforeEach(async () => {
        repository = repositoryStub();

        TestBed.configureTestingModule({
            imports: [CountriesPage],
            providers: [provideZonelessChangeDetection(), MessageService, { provide: CountryRepository, useValue: repository }]
        });

        session = TestBed.inject(SessionStore);
        session.setUser({ id: '1', username: 'admin', fullName: 'Administrador', roles: ['Administrador'] });

        fixture = TestBed.createComponent(CountriesPage);
        component = fixture.componentInstance;
        await settle(fixture);
    });

    it('loads the country list on init and exposes it to the table', () => {
        expect(repository.list).toHaveBeenCalledTimes(1);
        expect(component.items()).toEqual([CUBA]);
    });

    it('reflects the update permission in the toggle gate', () => {
        expect(component.canToggle()).toBe(false);

        session.setPermissions([{ resource: RESOURCES.Nomenclators, actions: [ACTIONS.Update] }]);
        expect(component.canToggle()).toBe(true);
    });

    it('routes page size changes through the store coordinator', () => {
        const pageSize = vi.spyOn(component.store, 'setPageSizeAndReload');
        const page = vi.spyOn(component.store, 'setPageAndReload');

        component.onPageChange({ page: 2, pageSize: 10 });
        expect(pageSize).toHaveBeenCalledWith(10);
        expect(page).not.toHaveBeenCalled();

        component.onPageChange({ page: 2, pageSize: 10 });
        expect(page).toHaveBeenCalledWith(2);
    });

    it('mounts the shared dialog for add and edit modes', () => {
        component.store.openAdd();
        fixture.detectChanges();
        expect((fixture.nativeElement as HTMLElement).querySelector('app-country-dialog')).toBeTruthy();

        component.store.openEdit(CUBA);
        fixture.detectChanges();
        expect((fixture.nativeElement as HTMLElement).querySelector('app-country-dialog')).toBeTruthy();
    });

    it('mounts the detail dialog with the selected id', () => {
        component.store.openDetail(CUBA);
        fixture.detectChanges();

        expect((fixture.nativeElement as HTMLElement).querySelector('app-country-detail-dialog')).toBeTruthy();
    });

    it('toggles a country through the store and notifies success', () => {
        const notify = vi.spyOn(component['notify'], 'show');

        component.onToggleActive({ country: CUBA, active: false });

        expect(repository.deactivate).toHaveBeenCalledWith('CU');
        expect(notify).toHaveBeenCalledWith('success', 'País desactivado correctamente.');
    });
});
