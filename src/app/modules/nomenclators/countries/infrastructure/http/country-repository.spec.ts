import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';

import { CountryRepository } from './country-repository';
import { ConfigService } from '@/app/core/services/config.service';
import { defaultQuery } from '@/app/core/interfaces/query-params';
import { Country, CountryInput } from '../../domain/country';
import { CountryDto } from '../dtos/country.dto';

const FAKE_SERVER_API = 'http://test-api';
const COUNTRIES_URL = `${FAKE_SERVER_API}/api/country`;

const CUBA_DTO: CountryDto = { code: 'CU', name: 'Cuba', active: true, isUnitedState: false };
const CUBA: Country = { code: 'CU', name: 'Cuba', active: true };
const PAYLOAD: CountryInput = { code: 'CU', name: 'Cuba' };

describe('CountryRepository', () => {
    let repository: CountryRepository;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: ConfigService, useValue: { urlWith: (sub: string) => `${FAKE_SERVER_API}${sub}` } }
            ]
        });

        repository = TestBed.inject(CountryRepository);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('lists through GET /api/country/all with the pagination params', async () => {
        const done = firstValueFrom(repository.list(defaultQuery()));

        const req = await vi.waitFor(() => httpMock.expectOne((r) => r.url === `${COUNTRIES_URL}/all`));
        expect(req.request.method).toBe('GET');
        expect(req.request.params.get('Pag.Page')).toBe('1');
        expect(req.request.params.get('Pag.PageSize')).toBe('5');

        req.flush({ objects: [CUBA_DTO], meta: { currentPage: 1, nextPage: null, prevPage: null, totalPage: 1, totalCount: 1 } });

        const response = await done;
        expect(response.objects).toEqual([CUBA]);
        expect(response.objects[0]).not.toHaveProperty('isUnitedState');
    });

    it('gets the detail through GET /api/country/{code}', async () => {
        const done = firstValueFrom(repository.getById('CU'));

        const req = await vi.waitFor(() => httpMock.expectOne(`${COUNTRIES_URL}/CU`));
        expect(req.request.method).toBe('GET');
        req.flush(CUBA_DTO);

        expect(await done).toEqual(CUBA);
    });

    it('creates through POST /api/country with name and code', async () => {
        const done = firstValueFrom(repository.create(PAYLOAD));

        const req = await vi.waitFor(() => httpMock.expectOne(COUNTRIES_URL));
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(PAYLOAD);
        req.flush(CUBA_DTO);

        expect(await done).toEqual(CUBA);
    });

    it('updates through PUT /api/country/{code} with name and code', async () => {
        const done = firstValueFrom(repository.update('CU', PAYLOAD));

        const req = await vi.waitFor(() => httpMock.expectOne(`${COUNTRIES_URL}/CU`));
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual(PAYLOAD);
        req.flush(CUBA_DTO);

        expect(await done).toEqual(CUBA);
    });

    it('activates through PUT /api/country/activate/{code} with an empty JSON body', async () => {
        const done = firstValueFrom(repository.activate('CU'));

        const req = await vi.waitFor(() => httpMock.expectOne(`${COUNTRIES_URL}/activate/CU`));
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual({});
        req.flush(null);

        expect((await done).body).toBeNull();
    });

    it('deactivates through DELETE /api/country/{code}', async () => {
        const done = firstValueFrom(repository.deactivate('CU'));

        const req = await vi.waitFor(() => httpMock.expectOne(`${COUNTRIES_URL}/CU`));
        expect(req.request.method).toBe('DELETE');
        req.flush(null);

        expect((await done).body).toBeNull();
    });
});
