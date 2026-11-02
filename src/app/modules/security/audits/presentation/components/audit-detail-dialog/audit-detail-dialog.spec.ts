import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { AuditDetailDialog } from './audit-detail-dialog';
import { AuditListStore } from '../../stores/audit-list.store';
import { AuditRepository } from '../../../infrastructure/http/audit-repository';
import { Audit } from '../../../domain/audit';

const AUDIT: Audit = {
    id: 'a1',
    userName: 'aruiz',
    userFullName: 'Ana Ruiz',
    userHostAddress: '10.0.0.1',
    moment: '2026-10-01T10:00:00',
    actionDescription: 'Login',
    message: 'ok'
};

describe('AuditDetailDialog', () => {
    let fixture: ComponentFixture<AuditDetailDialog>;
    let component: AuditDetailDialog;
    let getById: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        getById = vi.fn();

        TestBed.configureTestingModule({
            imports: [AuditDetailDialog],
            providers: [AuditListStore, { provide: AuditRepository, useValue: { list: vi.fn(), getById } }]
        });

        fixture = TestBed.createComponent(AuditDetailDialog);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('auditId', AUDIT.id);
    });

    it('loads the audit detail for the given id', async () => {
        getById.mockReturnValue(of(AUDIT));

        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(getById).toHaveBeenCalledWith('a1');
        expect(component.audit()).toEqual(AUDIT);
        expect(component.loading()).toBe(false);
        expect(component.errorMsg()).toBeNull();
    });

    it('exposes a friendly message when the load fails', async () => {
        getById.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500, error: {} })));

        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(component.audit()).toBeNull();
        expect(component.loading()).toBe(false);
        expect(component.errorMsg()).toBe('No se pudo obtener los detalles correspondientes a este registro.');
    });

    it('surfaces the backend detail when the error body carries one', async () => {
        getById.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404, error: { detail: 'La auditoría ya no existe' } })));

        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(component.errorMsg()).toBe('La auditoría ya no existe');
    });
});
