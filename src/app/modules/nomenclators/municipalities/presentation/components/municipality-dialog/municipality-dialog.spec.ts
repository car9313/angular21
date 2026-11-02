import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';

import { MunicipalityDialog } from './municipality-dialog';
import { MunicipalityListStore } from '@/app/modules/nomenclators/municipalities/presentation/stores/municipality-list.store';
import { Municipality } from '@/app/modules/nomenclators/municipalities/domain/municipality';

const CONSOLACION: Municipality = { code: 'MC1', descShort: 'CON', descLong: 'Consolación del Sur', active: true };

function storeStub() {
    return {
        saving: signal(false),
        createAndReload: vi.fn(() => of(CONSOLACION)),
        updateAndReload: vi.fn(() => of(CONSOLACION))
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

    beforeEach(() => {
        store = storeStub();

        TestBed.configureTestingModule({
            imports: [MunicipalityDialog],
            providers: [provideZonelessChangeDetection(), MessageService, { provide: MunicipalityListStore, useValue: store }]
        });

        fixture = TestBed.createComponent(MunicipalityDialog);
        component = fixture.componentInstance;
        fixture.detectChanges();
        TestBed.flushEffects();
    });

    it('pre-fills name and code when editing', () => {
        fixture.componentRef.setInput('municipality', CONSOLACION);
        fixture.detectChanges();
        TestBed.flushEffects();

        expect(input(fixture, 'municipality-name').value).toBe('Consolación del Sur');
        expect(input(fixture, 'municipality-code').value).toBe('MC1');
    });

    it('creates a trimmed municipality with name and code', () => {
        const form = component['form'];
        form.controls.name.setValue('  Consolación del Sur  ');
        form.controls.code.setValue('  MC1  ');

        component['onSubmit']();

        expect(store.createAndReload).toHaveBeenCalledWith({ name: 'Consolación del Sur', code: 'MC1' });
        expect(store.updateAndReload).not.toHaveBeenCalled();
    });

    it('updates the current municipality instead of creating a new one', () => {
        fixture.componentRef.setInput('municipality', CONSOLACION);
        fixture.detectChanges();
        TestBed.flushEffects();

        const form = component['form'];
        form.controls.name.setValue('Consolación Norte');
        form.controls.code.setValue('MC2');

        component['onSubmit']();

        expect(store.updateAndReload).toHaveBeenCalledWith('MC1', { name: 'Consolación Norte', code: 'MC2' });
        expect(store.createAndReload).not.toHaveBeenCalled();
    });

    it('reveals both required errors and does not persist an invalid form', () => {
        component['onSubmit']();
        fixture.detectChanges();

        expect(store.createAndReload).not.toHaveBeenCalled();
        expect(component['form'].controls.name.touched).toBe(true);
        expect(component['form'].controls.code.touched).toBe(true);
        expect(errors(fixture)).toEqual(['El nombre es requerido.', 'El código es requerido.']);
    });

    it('rejects whitespace-only values even though they satisfy required', () => {
        const form = component['form'];
        form.controls.name.setValue('   ');
        form.controls.code.setValue('MC1');

        component['onSubmit']();

        expect(store.createAndReload).not.toHaveBeenCalled();
        expect(form.controls.name.value).toBe('');
        expect(form.controls.name.touched).toBe(true);
    });

    it('emits saved after a successful create', () => {
        const saved = vi.fn();
        component.saved.subscribe(saved);
        component['form'].controls.name.setValue('Consolación del Sur');
        component['form'].controls.code.setValue('MC1');

        component['onSubmit']();

        expect(saved).toHaveBeenCalled();
    });
});
