import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';

import { CountryDialog } from './country-dialog';
import { CountriesListStore } from '@/app/modules/nomenclators/countries/presentation/stores/countries-list.store';
import { Country } from '@/app/modules/nomenclators/countries/domain/country';

const CUBA: Country = { name: 'Cuba', code: 'CU', active: true };

function storeStub() {
    return {
        saving: signal(false),
        createAndReload: vi.fn(() => of(CUBA)),
        updateAndReload: vi.fn(() => of(CUBA))
    };
}

function input(fixture: ComponentFixture<CountryDialog>, id: string): HTMLInputElement {
    return (fixture.nativeElement as HTMLElement).querySelector(`#${id}`) as HTMLInputElement;
}

function errors(fixture: ComponentFixture<CountryDialog>): string[] {
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('small.text-red-500')).map((el) => el.textContent?.trim() ?? '');
}

describe('CountryDialog', () => {
    let fixture: ComponentFixture<CountryDialog>;
    let component: CountryDialog;
    let store: ReturnType<typeof storeStub>;

    beforeEach(() => {
        store = storeStub();

        TestBed.configureTestingModule({
            imports: [CountryDialog],
            providers: [provideZonelessChangeDetection(), MessageService, { provide: CountriesListStore, useValue: store }]
        });

        fixture = TestBed.createComponent(CountryDialog);
        component = fixture.componentInstance;
        fixture.detectChanges();
        TestBed.flushEffects();
    });

    it('pre-fills name and code when editing', () => {
        fixture.componentRef.setInput('country', CUBA);
        fixture.detectChanges();
        TestBed.flushEffects();

        expect(input(fixture, 'country-name').value).toBe('Cuba');
        expect(input(fixture, 'country-code').value).toBe('CU');
    });

    it('creates a trimmed country with name and code', () => {
        const form = component['form'];
        form.controls.name.setValue('  Cuba  ');
        form.controls.code.setValue('  CU  ');

        component['onSubmit']();

        expect(store.createAndReload).toHaveBeenCalledWith({ name: 'Cuba', code: 'CU' });
        expect(store.updateAndReload).not.toHaveBeenCalled();
    });

    it('updates the current country instead of creating a new one', () => {
        fixture.componentRef.setInput('country', CUBA);
        fixture.detectChanges();
        TestBed.flushEffects();

        const form = component['form'];
        form.controls.name.setValue('República de Cuba');
        form.controls.code.setValue('CUB');

        component['onSubmit']();

        expect(store.updateAndReload).toHaveBeenCalledWith('CU', { name: 'República de Cuba', code: 'CUB' });
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
        form.controls.code.setValue('CU');

        component['onSubmit']();

        expect(store.createAndReload).not.toHaveBeenCalled();
        expect(form.controls.name.value).toBe('');
        expect(form.controls.name.touched).toBe(true);
    });

    it('emits saved after a successful create', () => {
        const saved = vi.fn();
        component.saved.subscribe(saved);
        component['form'].controls.name.setValue('Cuba');
        component['form'].controls.code.setValue('CU');

        component['onSubmit']();

        expect(saved).toHaveBeenCalled();
    });
});
