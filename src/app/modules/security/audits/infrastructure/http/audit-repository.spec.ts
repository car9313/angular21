import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';

import { AuditRepository } from './audit-repository';
import { ConfigService } from '@/app/core/services/config.service';
import { defaultQuery } from '@/app/core/interfaces/query-params';
import { Audit } from '../../domain/audit';
import { ActionType } from '../../domain/action-type';

const FAKE_SERVER_API = 'http://test-api';
const AUDITS_URL = `${FAKE_SERVER_API}/api/v1/audits`;

const AUDIT: Audit = {
    id: 'a1',
    userName: 'aruiz',
    userFullName: 'Ana Ruiz',
    userHostAddress: '10.0.0.1',
    moment: '2026-10-01T10:00:00',
    actionDescription: 'Login',
    message: 'ok'
};

const ACTION_TYPES: ActionType[] = [{ id: 1, name: 'Login' }];

describe('AuditRepository with config loaded', () => {
    let repository: AuditRepository;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: ConfigService, useValue: { urlWith: (sub: string) => `${FAKE_SERVER_API}${sub}` } }
            ]
        });

        repository = TestBed.inject(AuditRepository);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('list fetches /api/v1/audits with the .NET pagination params and resolves the page', async () => {
        const done = firstValueFrom(repository.list(defaultQuery()));

        const req = await vi.waitFor(() => httpMock.expectOne((r) => r.url === AUDITS_URL));
        expect(req.request.method).toBe('GET');
        expect(req.request.params.get('Pag.Page')).toBe('1');
        expect(req.request.params.get('Pag.PageSize')).toBe('5');

        req.flush({ objects: [AUDIT], meta: { currentPage: 1, nextPage: null, prevPage: null, totalPage: 1, totalCount: 1 } });

        const page = await done;
        expect(page.objects).toEqual([AUDIT]);
        expect(page.meta.totalCount).toBe(1);
    });

    it('getById fetches /api/v1/audits/{id} and resolves the entity', async () => {
        const done = firstValueFrom(repository.getById('a1'));

        const req = await vi.waitFor(() => httpMock.expectOne(`${AUDITS_URL}/a1`));
        expect(req.request.method).toBe('GET');
        req.flush(AUDIT);

        expect(await done).toEqual(AUDIT);
    });

    it('getActionTypes fetches /api/v1/audits/actions-types and resolves the catalog', async () => {
        const done = firstValueFrom(repository.getActionTypes());

        const req = await vi.waitFor(() => httpMock.expectOne(`${AUDITS_URL}/actions-types`));
        expect(req.request.method).toBe('GET');
        req.flush(ACTION_TYPES);

        expect(await done).toEqual(ACTION_TYPES);
    });
});

describe('AuditRepository without config', () => {
    let repository: AuditRepository;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: ConfigService, useValue: { urlWith: () => { throw new Error('Configuration not loaded: serverApi is not available'); } } }
            ]
        });

        repository = TestBed.inject(AuditRepository);
    });

    it('list throws synchronously before any request is sent', () => {
        expect(() => repository.list()).toThrow('Configuration not loaded: serverApi is not available');
    });
});
