import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';

import { MunicipalityDialog } from './municipality-dialog';
import { MunicipalityListStore } from '@/app/modules/nomenclators/municipalities/presentation/stores/municipality-list.store';
import { Municipality } from '@/app/modules/nomenclators/municipalities/domain/municipality';
import { ProvinceRepository } from '@/app/modules/nomenclators/provinces/infrastructure/http/province-repository';
import { Province } from '@/app/modules/nomenclators/provinces/domain/province';

const PINAR: Province = { code: 'PR', shortName: 'PRI', name: 'Pinar del Río', active: true };
const CONSOLACION: Municipality = { code: 'MC1', shortName: 'CON', name: 'Consolación del Sur', active: true, provinceCode: 'PR', provinceName: 'Pinar del Río' };

function storeStub() {
    return {
        saving: signal(false),
        createAndReload: vi.fn(() => of(CONSOLACION)),
        updateAndReload: vi.fn(() => of(CONSOLACION))
    };
}

function provinceRepositoryStub() {
    return {
        listForSelect: vi.fn(() => of({ objects: [PINAR], nextCursor: null })),
        getById: vi.fn(() => of(PINAR))
    };
}

function input(fixture: ComponentFixture<MunicipalityDialog>, id: string): HTMLInputElement {
    return (fixture.nativeElement as HTMLElement).querySelector(`#${id}`) as HTMLInputElement;
}

function errors(fixture: ComponentFixture<MunicipalityDialog>): string[] {
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('small.text-red-500')).map((el) => el.textContent?.trim() ?? '');
}

describe('MunicipalityDialog', () => {
    let fixture: ComponentFixture<MunicipalityDialog>;
    let component: MunicipalityDialog;
    let store: ReturnType<typeof storeStub>;
    let provinceRepository: ReturnType<typeof provinceRepositoryStub>;

    beforeEach(() => {
        store = storeStub();
        provinceRepository = provinceRepositoryStub();

        TestBed.configureTestingModule({
            imports: [MunicipalityDialog],
            providers: [
                provideZonelessChangeDetection(),
                MessageService,
                { provide: MunicipalityListStore, useValue: store },
                { provide: ProvinceRepository, useValue: provinceRepository }
            ]
        });

        fixture = TestBed.createComponent(MunicipalityDialog);
        component = fixture.componentInstance;
        fixture.detectChanges();
        TestBed.flushEffects();
    });

    it('pre-fills code, short name, name and province when editing', () => {
        fixture.componentRef.setInput('municipality', CONSOLACION);
        fixture.detectChanges();
        TestBed.flushEffects();

        expect(input(fixture, 'municipality-code').value).toBe('MC1');
        expect(input(fixture, 'municipality-short').value).toBe('CON');
        expect(input(fixture, 'municipality-name').value).toBe('Consolación del Sur');
        expect(component['form'].controls.provinceCode.value).toBe('PR');
    });

    it('creates a trimmed municipality with the domain payload, province included', () => {
        const form = component['form'];
        form.controls.code.setValue('  MC1  ');
        form.controls.shortName.setValue('  CON  ');
        form.controls.name.setValue('  Consolación del Sur  ');
        form.controls.provinceCode.setValue('  PR  ');

        component['onSubmit']();

        expect(store.createAndReload).toHaveBeenCalledWith({ code: 'MC1', shortName: 'CON', name: 'Consolación del Sur', provinceCode: 'PR' });
        expect(store.updateAndReload).not.toHaveBeenCalled();
    });

    it('updates the current municipality instead of creating a new one', () => {
        fixture.componentRef.setInput('municipality', CONSOLACION);
        fixture.detectChanges();
        TestBed.flushEffects();

        const form = component['form'];
        form.controls.code.setValue('MC2');
        form.controls.shortName.setValue('CON2');
        form.controls.name.setValue('Consolación Norte');
        form.controls.provinceCode.setValue('PR');

        component['onSubmit']();

        expect(store.updateAndReload).toHaveBeenCalledWith('MC1', { code: 'MC2', shortName: 'CON2', name: 'Consolación Norte', provinceCode: 'PR' });
        expect(store.createAndReload).not.toHaveBeenCalled();
    });

    it('reveals the four required errors and does not persist an invalid form', () => {
        component['onSubmit']();
        fixture.detectChanges();

        expect(store.createAndReload).not.toHaveBeenCalled();
        expect(component['form'].controls.code.touched).toBe(true);
        expect(component['form'].controls.shortName.touched).toBe(true);
        expect(component['form'].controls.name.touched).toBe(true);
        expect(component['form'].controls.provinceCode.touched).toBe(true);
        expect(errors(fixture)).toEqual(['El código es requerido.', 'El acrónimo es requerido.', 'El nombre es requerido.', 'La provincia es requerida.']);
    });

    it('rejects whitespace-only values even though they satisfy required', () => {
        const form = component['form'];
        form.controls.code.setValue('MC1');
        form.controls.shortName.setValue('CON');
        form.controls.name.setValue('Consolación del Sur');
        form.controls.provinceCode.setValue('   ');

        component['onSubmit']();

        expect(store.createAndReload).not.toHaveBeenCalled();
        expect(form.controls.provinceCode.value).toBe('');
        expect(form.controls.provinceCode.touched).toBe(true);
    });

    it('does not allow saving a municipality without a province', () => {
        const form = component['form'];
        form.controls.code.setValue('MC1');
        form.controls.shortName.setValue('CON');
        form.controls.name.setValue('Consolación del Sur');

        component['onSubmit']();

        expect(store.createAndReload).not.toHaveBeenCalled();
        expect(form.controls.provinceCode.invalid).toBe(true);
    });

    it('loads the province catalog for the selector', () => {
        expect(provinceRepository.listForSelect).toHaveBeenCalled();
    });

    it('emits saved after a successful create', () => {
        const saved = vi.fn();
        component.saved.subscribe(saved);
        component['form'].controls.code.setValue('MC1');
        component['form'].controls.shortName.setValue('CON');
        component['form'].controls.name.setValue('Consolación del Sur');
        component['form'].controls.provinceCode.setValue('PR');

        component['onSubmit']();

        expect(saved).toHaveBeenCalled();
    });
});
