import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';

import { MunicipalityRepository } from './municipality-repository';
import { ConfigService } from '@/app/core/services/config.service';
import { defaultQuery } from '@/app/core/interfaces/query-params';
import { Municipality, MunicipalityInput } from '../../domain/municipality';
import { MunicipalityDto } from '../dtos/municipality.dto';

const FAKE_SERVER_API = 'http://test-api';
const MUNICIPALITIES_URL = `${FAKE_SERVER_API}/api/municipality`;

const CONSOLACION_DTO: MunicipalityDto = {
    code: 'MC1',
    descShort: 'CON',
    descLong: 'Consolación del Sur',
    active: true,
    provinceCode: 'PR',
    provinceDescLong: 'Pinar del Río'
};
const CONSOLACION: Municipality = {
    code: 'MC1',
    shortName: 'CON',
    name: 'Consolación del Sur',
    active: true,
    provinceCode: 'PR',
    provinceName: 'Pinar del Río'
};
const CONSOLACION_INPUT: MunicipalityInput = { code: 'MC1', shortName: 'CON', name: 'Consolación del Sur', provinceCode: 'PR' };

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

    it('lists all municipalities through GET /api/municipality/all and maps the DTO', async () => {
        const done = firstValueFrom(repository.list(defaultQuery()));

        const req = await vi.waitFor(() => httpMock.expectOne((r) => r.url === `${MUNICIPALITIES_URL}/all`));
        expect(req.request.method).toBe('GET');
        expect(req.request.params.get('Pag.Page')).toBe('1');

        req.flush({ objects: [CONSOLACION_DTO], meta: { currentPage: 1, nextPage: null, prevPage: null, totalPage: 1, totalCount: 1 } });

        expect((await done).objects).toEqual([CONSOLACION]);
    });

    it('maps a municipality without province fields to nulls', async () => {
        const done = firstValueFrom(repository.getById('MC1'));
        const withoutProvince: MunicipalityDto = {
            code: CONSOLACION_DTO.code,
            descShort: CONSOLACION_DTO.descShort,
            descLong: CONSOLACION_DTO.descLong,
            active: CONSOLACION_DTO.active
        };

        const req = await vi.waitFor(() => httpMock.expectOne(`${MUNICIPALITIES_URL}/MC1`));
        req.flush(withoutProvince);

        expect(await done).toEqual({ ...CONSOLACION, provinceCode: null, provinceName: null });
    });

    it('gets the detail through GET /api/municipality/{code}', async () => {
        const done = firstValueFrom(repository.getById('MC1'));

        const req = await vi.waitFor(() => httpMock.expectOne(`${MUNICIPALITIES_URL}/MC1`));
        expect(req.request.method).toBe('GET');
        req.flush(CONSOLACION_DTO);

        expect(await done).toEqual(CONSOLACION);
    });

    it('lists by province through GET /api/municipality/province/{code} with Cursor and Filter', async () => {
        const done = firstValueFrom(repository.listByProvince('PR', 'cursor-1', 'consolacion'));

        const req = await vi.waitFor(() => httpMock.expectOne((r) => r.url === `${MUNICIPALITIES_URL}/province/PR`));
        expect(req.request.method).toBe('GET');
        expect(req.request.params.get('Cursor')).toBe('cursor-1');
        expect(req.request.params.get('Filter')).toBe('consolacion');

        req.flush({ objects: [CONSOLACION_DTO], nextCursor: 'cursor-2' });

        expect(await done).toEqual({ objects: [CONSOLACION], nextCursor: 'cursor-2' });
    });

    it('creates through POST /api/municipality sending provinceCode', async () => {
        const done = firstValueFrom(repository.create(CONSOLACION_INPUT));

        const req = await vi.waitFor(() => httpMock.expectOne(MUNICIPALITIES_URL));
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ code: 'MC1', descShort: 'CON', descLong: 'Consolación del Sur', provinceCode: 'PR' });
        req.flush(CONSOLACION_DTO);

        expect(await done).toEqual(CONSOLACION);
    });

    it('updates through PUT /api/municipality/{code} sending provinceCode', async () => {
        const done = firstValueFrom(repository.update('MC1', CONSOLACION_INPUT));

        const req = await vi.waitFor(() => httpMock.expectOne(`${MUNICIPALITIES_URL}/MC1`));
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual({ code: 'MC1', descShort: 'CON', descLong: 'Consolación del Sur', provinceCode: 'PR' });
        req.flush(CONSOLACION_DTO);

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
