import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { ProvinceDetailDialog } from './province-detail-dialog';
import { ProvinceRepository } from '@/app/modules/nomenclators/provinces/infraestructure/http/province-repository';
import { Province } from '@/app/modules/nomenclators/provinces/domain/province';

const PINAR: Province = { code: 'PR', descShort: 'PRI', descLong: 'Pinar del Río', active: true };

describe('ProvinceDetailDialog', () => {
    let fixture: ComponentFixture<ProvinceDetailDialog>;
    let component: ProvinceDetailDialog;
    let getById: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        getById = vi.fn();

        TestBed.configureTestingModule({
            imports: [ProvinceDetailDialog],
            providers: [{ provide: ProvinceRepository, useValue: { getById } }]
        });

        fixture = TestBed.createComponent(ProvinceDetailDialog);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('provinceCode', PINAR.code);
    });

    it('loads the detail for the given code', async () => {
        getById.mockReturnValue(of(PINAR));

        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(getById).toHaveBeenCalledWith('PR');
        expect(component.province()).toEqual(PINAR);
        expect(component.loading()).toBe(false);
        expect(component.errorMsg()).toBeNull();
    });

    it('exposes a friendly fallback when the load fails', async () => {
        getById.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500, error: {} })));

        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(component.province()).toBeNull();
        expect(component.loading()).toBe(false);
        expect(component.errorMsg()).toBe('No se pudo obtener los detalles de esta provincia.');
    });

    it('surfaces the backend detail when the error body carries one', async () => {
        getById.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404, error: { detail: 'La provincia ya no existe' } })));

        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(component.errorMsg()).toBe('La provincia ya no existe');
    });

    it('emits cancelled when the dialog closes', () => {
        const cancelled = vi.fn();
        component.cancelled.subscribe(cancelled);

        component.onVisibleChange(false);

        expect(cancelled).toHaveBeenCalled();
    });
});
