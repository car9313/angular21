import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';

import { ProvinceRepository } from './province-repository';
import { ConfigService } from '@/app/core/services/config.service';
import { defaultQuery } from '@/app/core/interfaces/query-params';
import { Province, ProvinceInput } from '../../domain/province';
import { ProvinceDto } from '../dtos/province.dto';

const FAKE_SERVER_API = 'http://test-api';
const PROVINCES_URL = `${FAKE_SERVER_API}/api/province`;

const PINAR_DTO: ProvinceDto = { code: 'PR', descShort: 'PRI', descLong: 'Pinar del Río', active: true };
const PINAR: Province = { code: 'PR', shortName: 'PRI', name: 'Pinar del Río', active: true };
const PINAR_INPUT: ProvinceInput = { code: 'PR', shortName: 'PRI', name: 'Pinar del Río' };

describe('ProvinceRepository', () => {
    let repository: ProvinceRepository;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: ConfigService, useValue: { urlWith: (sub: string) => `${FAKE_SERVER_API}${sub}` } }
            ]
        });

        repository = TestBed.inject(ProvinceRepository);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('lists through GET /api/province/all and maps the wire DTO to the domain', async () => {
        const done = firstValueFrom(repository.list(defaultQuery()));

        const req = await vi.waitFor(() => httpMock.expectOne((r) => r.url === `${PROVINCES_URL}/all`));
        expect(req.request.method).toBe('GET');
        expect(req.request.params.get('Pag.Page')).toBe('1');
        expect(req.request.params.get('Pag.PageSize')).toBe('5');

        req.flush({ objects: [PINAR_DTO], meta: { currentPage: 1, nextPage: null, prevPage: null, totalPage: 1, totalCount: 1 } });

        const response = await done;
        expect(response.objects).toEqual([PINAR]);
        expect(response.objects[0]).not.toHaveProperty('descLong');
    });

    it('gets the detail through GET /api/province/{code}', async () => {
        const done = firstValueFrom(repository.getById('PR'));

        const req = await vi.waitFor(() => httpMock.expectOne(`${PROVINCES_URL}/PR`));
        expect(req.request.method).toBe('GET');
        req.flush(PINAR_DTO);

        expect(await done).toEqual(PINAR);
    });

    it('loads the select page through GET /api/province with Cursor and Filter', async () => {
        const done = firstValueFrom(repository.listForSelect('cursor-1', 'pinar'));

        const req = await vi.waitFor(() => httpMock.expectOne((r) => r.url === PROVINCES_URL));
        expect(req.request.method).toBe('GET');
        expect(req.request.params.get('Cursor')).toBe('cursor-1');
        expect(req.request.params.get('Filter')).toBe('pinar');

        req.flush({ objects: [PINAR_DTO], nextCursor: 'cursor-2' });

        expect(await done).toEqual({ objects: [PINAR], nextCursor: 'cursor-2' });
    });

    it('creates through POST /api/province with the wire payload', async () => {
        const done = firstValueFrom(repository.create(PINAR_INPUT));

        const req = await vi.waitFor(() => httpMock.expectOne(PROVINCES_URL));
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ code: 'PR', descShort: 'PRI', descLong: 'Pinar del Río' });
        req.flush(PINAR_DTO);

        expect(await done).toEqual(PINAR);
    });

    it('updates through PUT /api/province/{code} with the wire payload', async () => {
        const done = firstValueFrom(repository.update('PR', PINAR_INPUT));

        const req = await vi.waitFor(() => httpMock.expectOne(`${PROVINCES_URL}/PR`));
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual({ code: 'PR', descShort: 'PRI', descLong: 'Pinar del Río' });
        req.flush(PINAR_DTO);

        expect(await done).toEqual(PINAR);
    });

    it('activates through PUT /api/province/activate/{code}', async () => {
        const done = firstValueFrom(repository.activate('PR'));

        const req = await vi.waitFor(() => httpMock.expectOne(`${PROVINCES_URL}/activate/PR`));
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual({});
        req.flush(null);

        expect((await done).body).toBeNull();
    });

    it('deactivates through DELETE /api/province/{code}', async () => {
        const done = firstValueFrom(repository.deactivate('PR'));

        const req = await vi.waitFor(() => httpMock.expectOne(`${PROVINCES_URL}/PR`));
        expect(req.request.method).toBe('DELETE');
        req.flush(null);

        expect((await done).body).toBeNull();
    });
});
