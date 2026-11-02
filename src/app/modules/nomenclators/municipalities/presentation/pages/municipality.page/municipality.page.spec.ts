import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Observable, of } from 'rxjs';
import { MessageService } from 'primeng/api';

import { MunicipalityPage } from './municipality.page';
import { MunicipalityRepository } from '@/app/modules/nomenclators/municipalities/infraestructure/http/municipality-repository';
import { Municipality } from '@/app/modules/nomenclators/municipalities/domain/municipality';
import { SessionStore } from '@/app/core/store/session.store';
import { RESOURCES } from '@/app/core/constants/resources';
import { ACTIONS } from '@/app/core/constants/actions';

const CONSOLACION: Municipality = { code: 'MC1', descShort: 'CON', descLong: 'Consolación del Sur', active: true };

const PAGE = {
    objects: [CONSOLACION],
    meta: { currentPage: 1, nextPage: null, prevPage: null, totalPage: 1, totalCount: 1 }
};

function repositoryStub() {
    return {
        list: vi.fn(() => of(PAGE)),
        getById: vi.fn(() => of(CONSOLACION)),
        create: vi.fn(() => of(CONSOLACION)),
        update: vi.fn(() => of(CONSOLACION)),
        activate: vi.fn<() => Observable<void>>(() => of<void>(undefined)),
        deactivate: vi.fn<() => Observable<void>>(() => of<void>(undefined)),
        delete: vi.fn<() => Observable<void>>(() => of<void>(undefined))
    };
}

async function settle(fixture: ComponentFixture<MunicipalityPage>): Promise<void> {
    fixture.detectChanges();
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();
}

describe('MunicipalityPage', () => {
    let fixture: ComponentFixture<MunicipalityPage>;
    let component: MunicipalityPage;
    let repository: ReturnType<typeof repositoryStub>;
    let session: InstanceType<typeof SessionStore>;

    beforeEach(async () => {
        repository = repositoryStub();

        TestBed.configureTestingModule({
            imports: [MunicipalityPage],
            providers: [provideZonelessChangeDetection(), MessageService, { provide: MunicipalityRepository, useValue: repository }]
        });

        session = TestBed.inject(SessionStore);
        session.setUser({ id: '1', username: 'admin', fullName: 'Administrador', roles: ['Administrador'] });

        fixture = TestBed.createComponent(MunicipalityPage);
        component = fixture.componentInstance;
        await settle(fixture);
    });

    it('loads the municipality list on init and exposes it to the table', () => {
        expect(repository.list).toHaveBeenCalledTimes(1);
        expect(component.items()).toEqual([CONSOLACION]);
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
        expect((fixture.nativeElement as HTMLElement).querySelector('app-municipality-dialog')).toBeTruthy();

        component.store.openEdit(CONSOLACION);
        fixture.detectChanges();
        expect((fixture.nativeElement as HTMLElement).querySelector('app-municipality-dialog')).toBeTruthy();
    });

    it('mounts the detail dialog with the selected code', () => {
        component.store.openDetail(CONSOLACION);
        fixture.detectChanges();

        expect((fixture.nativeElement as HTMLElement).querySelector('app-municipality-detail-dialog')).toBeTruthy();
    });

    it('toggles a municipality through the store and notifies success', () => {
        const notify = vi.spyOn(component['notify'], 'show');

        component.onToggleActive({ municipality: CONSOLACION, active: false });

        expect(repository.deactivate).toHaveBeenCalledWith('MC1');
        expect(notify).toHaveBeenCalledWith('success', 'Municipio desactivado correctamente.');
    });
});
