import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { MunicipalityDetailDialog } from './municipality-detail-dialog';
import { MunicipalityRepository } from '@/app/modules/nomenclators/municipalities/infraestructure/http/municipality-repository';
import { Municipality } from '@/app/modules/nomenclators/municipalities/domain/municipality';

const CONSOLACION: Municipality = { code: 'MC1', descShort: 'CON', descLong: 'Consolación del Sur', active: true };

describe('MunicipalityDetailDialog', () => {
    let fixture: ComponentFixture<MunicipalityDetailDialog>;
    let component: MunicipalityDetailDialog;
    let getById: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        getById = vi.fn();

        TestBed.configureTestingModule({
            imports: [MunicipalityDetailDialog],
            providers: [{ provide: MunicipalityRepository, useValue: { getById } }]
        });

        fixture = TestBed.createComponent(MunicipalityDetailDialog);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('municipalityCode', CONSOLACION.code);
    });

    it('loads the detail for the given code', async () => {
        getById.mockReturnValue(of(CONSOLACION));

        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(getById).toHaveBeenCalledWith('MC1');
        expect(component.municipality()).toEqual(CONSOLACION);
        expect(component.loading()).toBe(false);
        expect(component.errorMsg()).toBeNull();
    });

    it('exposes a friendly fallback when the load fails', async () => {
        getById.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500, error: {} })));

        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(component.municipality()).toBeNull();
        expect(component.loading()).toBe(false);
        expect(component.errorMsg()).toBe('No se pudo obtener los detalles de este municipio.');
    });

    it('surfaces the backend detail when the error body carries one', async () => {
        getById.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404, error: { detail: 'El municipio ya no existe' } })));

        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(component.errorMsg()).toBe('El municipio ya no existe');
    });

    it('emits cancelled when the dialog closes', () => {
        const cancelled = vi.fn();
        component.cancelled.subscribe(cancelled);

        component.onVisibleChange(false);

        expect(cancelled).toHaveBeenCalled();
    });
});
