import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Observable, of } from 'rxjs';
import { MessageService } from 'primeng/api';

import { ProvincesPage } from './provinces.page';
import { ProvinceRepository } from '@/app/modules/nomenclators/provinces/infrastructure/http/province-repository';
import { Province } from '@/app/modules/nomenclators/provinces/domain/province';
import { SessionStore } from '@/app/core/store/session.store';
import { RESOURCES } from '@/app/core/constants/resources';
import { ACTIONS } from '@/app/core/constants/actions';

const PINAR: Province = { code: 'PR', shortName: 'PRI', name: 'Pinar del Río', active: true };

const PAGE = {
    objects: [PINAR],
    meta: { currentPage: 1, nextPage: null, prevPage: null, totalPage: 1, totalCount: 1 }
};

function repositoryStub() {
    return {
        list: vi.fn(() => of(PAGE)),
        getById: vi.fn(() => of(PINAR)),
        create: vi.fn(() => of(PINAR)),
        update: vi.fn(() => of(PINAR)),
        activate: vi.fn<() => Observable<void>>(() => of<void>(undefined)),
        deactivate: vi.fn<() => Observable<void>>(() => of<void>(undefined)),
        delete: vi.fn<() => Observable<void>>(() => of<void>(undefined))
    };
}

async function settle(fixture: ComponentFixture<ProvincesPage>): Promise<void> {
    fixture.detectChanges();
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();
}

describe('ProvincesPage', () => {
    let fixture: ComponentFixture<ProvincesPage>;
    let component: ProvincesPage;
    let repository: ReturnType<typeof repositoryStub>;
    let session: InstanceType<typeof SessionStore>;

    beforeEach(async () => {
        repository = repositoryStub();

        TestBed.configureTestingModule({
            imports: [ProvincesPage],
            providers: [provideZonelessChangeDetection(), MessageService, { provide: ProvinceRepository, useValue: repository }]
        });

        session = TestBed.inject(SessionStore);
        session.setUser({ id: '1', username: 'admin', fullName: 'Administrador', roles: ['Administrador'] });

        fixture = TestBed.createComponent(ProvincesPage);
        component = fixture.componentInstance;
        await settle(fixture);
    });

    it('loads the province list on init and exposes it to the table', () => {
        expect(repository.list).toHaveBeenCalledTimes(1);
        expect(component.items()).toEqual([PINAR]);
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
        expect((fixture.nativeElement as HTMLElement).querySelector('app-province-dialog')).toBeTruthy();

        component.store.openEdit(PINAR);
        fixture.detectChanges();
        expect((fixture.nativeElement as HTMLElement).querySelector('app-province-dialog')).toBeTruthy();
    });

    it('mounts the detail dialog with the selected code', () => {
        component.store.openDetail(PINAR);
        fixture.detectChanges();

        expect((fixture.nativeElement as HTMLElement).querySelector('app-province-detail-dialog')).toBeTruthy();
    });

    it('toggles a province through the store and notifies success', () => {
        const notify = vi.spyOn(component['notify'], 'show');

        component.onToggleActive({ province: PINAR, active: false });

        expect(repository.deactivate).toHaveBeenCalledWith('PR');
        expect(notify).toHaveBeenCalledWith('success', 'Provincia desactivada correctamente.');
    });
});
