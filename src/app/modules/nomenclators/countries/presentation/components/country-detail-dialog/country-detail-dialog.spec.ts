import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { CountryDetailDialog } from './country-detail-dialog';
import { CountriesListStore } from '@/app/modules/nomenclators/countries/presentation/stores/countries-list.store';
import { Country } from '@/app/modules/nomenclators/countries/domain/country';

const CUBA: Country = { id: 1, name: 'Cuba', code: 'CU', active: true };

describe('CountryDetailDialog', () => {
    let fixture: ComponentFixture<CountryDetailDialog>;
    let component: CountryDetailDialog;
    let getById: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        getById = vi.fn();

        TestBed.configureTestingModule({
            imports: [CountryDetailDialog],
            providers: [{ provide: CountriesListStore, useValue: { getById } }]
        });

        fixture = TestBed.createComponent(CountryDetailDialog);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('countryCode', CUBA.code);
    });

    it('loads the detail for the given code', async () => {
        getById.mockReturnValue(of(CUBA));

        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(getById).toHaveBeenCalledWith('CU');
        expect(component.country()).toEqual(CUBA);
        expect(component.loading()).toBe(false);
        expect(component.errorMsg()).toBeNull();
    });

    it('exposes a friendly fallback when the load fails', async () => {
        getById.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500, error: {} })));

        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(component.country()).toBeNull();
        expect(component.loading()).toBe(false);
        expect(component.errorMsg()).toBe('No se pudo obtener los detalles de este país.');
    });

    it('surfaces the backend detail when the error body carries one', async () => {
        getById.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404, error: { detail: 'El país ya no existe' } })));

        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(component.errorMsg()).toBe('El país ya no existe');
    });

    it('emits cancelled when the dialog closes', () => {
        const cancelled = vi.fn();
        component.cancelled.subscribe(cancelled);

        component.onVisibleChange(false);

        expect(cancelled).toHaveBeenCalled();
    });
});
