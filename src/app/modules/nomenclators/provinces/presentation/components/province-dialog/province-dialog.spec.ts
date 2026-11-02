import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';

import { ProvinceDialog } from './province-dialog';
import { ProvinceListStore } from '@/app/modules/nomenclators/provinces/presentation/stores/province-list.store';
import { Province } from '@/app/modules/nomenclators/provinces/domain/province';

const PINAR: Province = { code: 'PR', descShort: 'PRI', descLong: 'Pinar del Río', active: true };

function storeStub() {
    return {
        saving: signal(false),
        createAndReload: vi.fn(() => of(PINAR)),
        updateAndReload: vi.fn(() => of(PINAR))
    };
}

function input(fixture: ComponentFixture<ProvinceDialog>, id: string): HTMLInputElement {
    return (fixture.nativeElement as HTMLElement).querySelector(`#${id}`) as HTMLInputElement;
}

function errors(fixture: ComponentFixture<ProvinceDialog>): string[] {
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('small.text-red-500')).map((el) => el.textContent?.trim() ?? '');
}

describe('ProvinceDialog', () => {
    let fixture: ComponentFixture<ProvinceDialog>;
    let component: ProvinceDialog;
    let store: ReturnType<typeof storeStub>;

    beforeEach(() => {
        store = storeStub();

        TestBed.configureTestingModule({
            imports: [ProvinceDialog],
            providers: [provideZonelessChangeDetection(), MessageService, { provide: ProvinceListStore, useValue: store }]
        });

        fixture = TestBed.createComponent(ProvinceDialog);
        component = fixture.componentInstance;
        fixture.detectChanges();
        TestBed.flushEffects();
    });

    it('pre-fills code, short name and name when editing', () => {
        fixture.componentRef.setInput('province', PINAR);
        fixture.detectChanges();
        TestBed.flushEffects();

        expect(input(fixture, 'province-code').value).toBe('PR');
        expect(input(fixture, 'province-short').value).toBe('PRI');
        expect(input(fixture, 'province-name').value).toBe('Pinar del Río');
    });

    it('creates a trimmed province with the domain payload', () => {
        const form = component['form'];
        form.controls.code.setValue('  PR  ');
        form.controls.descShort.setValue('  PRI  ');
        form.controls.descLong.setValue('  Pinar del Río  ');

        component['onSubmit']();

        expect(store.createAndReload).toHaveBeenCalledWith({ code: 'PR', descShort: 'PRI', descLong: 'Pinar del Río' });
        expect(store.updateAndReload).not.toHaveBeenCalled();
    });

    it('updates the current province instead of creating a new one', () => {
        fixture.componentRef.setInput('province', PINAR);
        fixture.detectChanges();
        TestBed.flushEffects();

        const form = component['form'];
        form.controls.code.setValue('PRN');
        form.controls.descShort.setValue('PRN');
        form.controls.descLong.setValue('Pinar del Río Norte');

        component['onSubmit']();

        expect(store.updateAndReload).toHaveBeenCalledWith('PR', { code: 'PRN', descShort: 'PRN', descLong: 'Pinar del Río Norte' });
        expect(store.createAndReload).not.toHaveBeenCalled();
    });

    it('reveals the three required errors and does not persist an invalid form', () => {
        component['onSubmit']();
        fixture.detectChanges();

        expect(store.createAndReload).not.toHaveBeenCalled();
        expect(component['form'].controls.code.touched).toBe(true);
        expect(component['form'].controls.descShort.touched).toBe(true);
        expect(component['form'].controls.descLong.touched).toBe(true);
        expect(errors(fixture)).toEqual(['El código es requerido.', 'El acrónimo es requerido.', 'El nombre es requerido.']);
    });

    it('rejects whitespace-only values even though they satisfy required', () => {
        const form = component['form'];
        form.controls.code.setValue('PR');
        form.controls.descShort.setValue('   ');
        form.controls.descLong.setValue('Pinar del Río');

        component['onSubmit']();

        expect(store.createAndReload).not.toHaveBeenCalled();
        expect(form.controls.descShort.value).toBe('');
        expect(form.controls.descShort.touched).toBe(true);
    });

    it('emits saved after a successful create', () => {
        const saved = vi.fn();
        component.saved.subscribe(saved);
        component['form'].controls.code.setValue('PR');
        component['form'].controls.descShort.setValue('PRI');
        component['form'].controls.descLong.setValue('Pinar del Río');

        component['onSubmit']();

        expect(saved).toHaveBeenCalled();
    });
});
