import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ConfigService } from './config.service';

describe('ConfigService', () => {
    let service: ConfigService;
    let http: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()]
        });
        service = TestBed.inject(ConfigService);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        http.verify();
    });

    it('throws when accessed before loading', () => {
        expect(() => service.url).toThrowError(/no cargada/);
    });

    it('loads the development runtime config file on load()', async () => {
        const promise = service.load();

        const req = http.expectOne('/assets/config.development.json');
        expect(req.request.method).toBe('GET');
        req.flush({ serverApi: 'http://localhost:1235' });

        await promise;
        expect(service.url).toBe('http://localhost:1235');
    });

    it('throws when the loaded config has no serverApi', async () => {
        const promise = service.load();

        http.expectOne('/assets/config.development.json').flush({});

        await expect(promise).rejects.toThrowError(/serverApi no está definido/);
    });

    it('builds absolute urls with urlWith', async () => {
        const promise = service.load();
        http.expectOne('/assets/config.development.json').flush({ serverApi: 'http://api.test' });
        await promise;

        expect(service.urlWith('/api/v1/people')).toBe('http://api.test/api/v1/people');
    });

    it('exposes arbitrary runtime keys via get()', async () => {
        const promise = service.load();
        http.expectOne('/assets/config.development.json').flush({ serverApi: 'http://api.test', featureX: true });
        await promise;

        expect(service.get('featureX')).toBe(true);
        expect(service.get('missing')).toBeUndefined();
    });
});