import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { GenericHttpService } from './generic-http.service';
import { ConfigService } from './config.service';
import { defaultQuery, QueryParams } from '../interfaces/query-params';

describe('GenericHttpService', () => {
    let service: GenericHttpService;
    let config: ConfigService;
    let http: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()]
        });
        service = TestBed.inject(GenericHttpService);
        config = TestBed.inject(ConfigService);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        http.verify();
    });

    async function loadConfig() {
        const loadPromise = config.load();
        http.expectOne('/assets/config.development.json').flush({ serverApi: 'http://api.test' });
        await loadPromise;
    }

    it('rejects when config was not loaded yet', async () => {
        await expect(service.getAll('/api/v1/people', defaultQuery())).rejects.toThrowError(/not loaded/);
    });

    it('getAll maps QueryParams into the .NET contract and returns the page', async () => {
        await loadConfig();

        const query: QueryParams = {
            search: { SearchText: 'ana', Strict: false },
            filter: [{ PropertyName: 'CityId', PropertyValue: '9' }],
            sort: [{ SortBy: 'Name', Ascending: true }],
            pag: { Page: 2, PageSize: 25 }
        };

        const promise = service.getAll<{ id: number }>('/api/v1/people', query);
        const req = http.expectOne((r) => r.url === 'http://api.test/api/v1/people');

        expect(req.request.method).toBe('GET');
        expect(req.request.params.get('Pag.Page')).toBe('2');
        expect(req.request.params.get('Pag.PageSize')).toBe('25');
        expect(req.request.params.get('Search.SearchText')).toBe('ana');
        expect(req.request.params.get('Filter')).toBe(JSON.stringify(query.filter));
        expect(req.request.params.get('Sort[0].SortBy')).toBe('Name');

        const response = { objects: [{ id: 1 }, { id: 2 }], meta: { totalCount: 2, totalPage: 1, currentPage: 2, nextPage: null, prevPage: 1 } };
        req.flush(response);

        await expect(promise).resolves.toEqual(response);
    });

    it('getArray fetches plain catalogue arrays', async () => {
        await loadConfig();

        const promise = service.getArray<string>('/api/v1/countries');
        http.expectOne('http://api.test/api/v1/countries').flush(['AR', 'UY']);

        await expect(promise).resolves.toEqual(['AR', 'UY']);
    });

    it('getById GETs the full suffix path', async () => {
        await loadConfig();

        const promise = service.getById<{ id: number }>('/api/v1/people/42');
        http.expectOne('http://api.test/api/v1/people/42').flush({ id: 42 });

        await expect(promise).resolves.toEqual({ id: 42 });
    });

    it('create POSTs the body and returns the server result', async () => {
        await loadConfig();

        const promise = service.create<{ id: number }>('/api/v1/people', { name: 'Ana' });
        const req = http.expectOne('http://api.test/api/v1/people');

        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ name: 'Ana' });
        req.flush({ id: 7 });

        await expect(promise).resolves.toEqual({ id: 7 });
    });

    it('update PUTs the body', async () => {
        await loadConfig();

        const promise = service.update<{ ok: boolean }>('/api/v1/people/7', { name: 'Ana B' });
        const req = http.expectOne('http://api.test/api/v1/people/7');

        expect(req.request.method).toBe('PUT');
        req.flush({ ok: true });

        await expect(promise).resolves.toEqual({ ok: true });
    });

    it('delete DELETEs the resource', async () => {
        await loadConfig();

        const promise = service.delete('/api/v1/people/7');
        const req = http.expectOne('http://api.test/api/v1/people/7');

        expect(req.request.method).toBe('DELETE');
        req.flush(null);

        await promise;
    });
});