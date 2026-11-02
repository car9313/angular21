import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';

import { MunicipalityRepository } from './municipality-repository';
import { ConfigService } from '@/app/core/services/config.service';
import { defaultQuery } from '@/app/core/interfaces/query-params';
import { Municipality } from '../../domain/municipality';

const FAKE_SERVER_API = 'http://test-api';
const MUNICIPALITIES_URL = `${FAKE_SERVER_API}/api/municipality`;

const CONSOLACION: Municipality = { code: 'MC1', descShort: 'CON', descLong: 'Consolación del Sur', active: true };
const PAYLOAD = { code: 'MC1', descShort: 'CON', descLong: 'Consolación del Sur' };

describe('MunicipalityRepository', () => {
    let repository: MunicipalityRepository;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: ConfigService, useValue: { urlWith: (sub: string) => `${FAKE_SERVER_API}${sub}` } }
            ]
        });

        repository = TestBed.inject(MunicipalityRepository);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('lists through GET /api/municipality/all with the pagination params', async () => {
        const done = firstValueFrom(repository.list(defaultQuery()));

        const req = await vi.waitFor(() => httpMock.expectOne((r) => r.url === `${MUNICIPALITIES_URL}/all`));
        expect(req.request.method).toBe('GET');
        expect(req.request.params.get('Pag.Page')).toBe('1');
        expect(req.request.params.get('Pag.PageSize')).toBe('5');

        req.flush({ objects: [CONSOLACION], meta: { currentPage: 1, nextPage: null, prevPage: null, totalPage: 1, totalCount: 1 } });

        expect((await done).objects).toEqual([CONSOLACION]);
    });

    it('gets the detail through GET /api/municipality/{code}', async () => {
        const done = firstValueFrom(repository.getById('MC1'));

        const req = await vi.waitFor(() => httpMock.expectOne(`${MUNICIPALITIES_URL}/MC1`));
        expect(req.request.method).toBe('GET');
        req.flush(CONSOLACION);

        expect(await done).toEqual(CONSOLACION);
    });

    it('creates through POST /api/municipality with the domain payload', async () => {
        const done = firstValueFrom(repository.create(PAYLOAD));

        const req = await vi.waitFor(() => httpMock.expectOne(MUNICIPALITIES_URL));
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(PAYLOAD);
        req.flush(CONSOLACION);

        expect(await done).toEqual(CONSOLACION);
    });

    it('updates through PUT /api/municipality/{code}', async () => {
        const done = firstValueFrom(repository.update('MC1', PAYLOAD));

        const req = await vi.waitFor(() => httpMock.expectOne(`${MUNICIPALITIES_URL}/MC1`));
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual(PAYLOAD);
        req.flush(CONSOLACION);

        expect(await done).toEqual(CONSOLACION);
    });

    it('activates through PUT /api/municipality/activate/{code}', async () => {
        const done = firstValueFrom(repository.activate('MC1'));

        const req = await vi.waitFor(() => httpMock.expectOne(`${MUNICIPALITIES_URL}/activate/MC1`));
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual({});
        req.flush(null);

        expect((await done).body).toBeNull();
    });

    it('deactivates through DELETE /api/municipality/{code}', async () => {
        const done = firstValueFrom(repository.deactivate('MC1'));

        const req = await vi.waitFor(() => httpMock.expectOne(`${MUNICIPALITIES_URL}/MC1`));
        expect(req.request.method).toBe('DELETE');
        req.flush(null);

        expect((await done).body).toBeNull();
    });
});
