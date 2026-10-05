import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';

import { SettingsRepository } from './settings-repository';
import { ConfigService } from '../../../../core/services/config.service';
import { makeSecuritySettings } from '../domain/security-settings';

const FAKE_SERVER_API = 'http://test-api';
const APP_SETTINGS_URL = `${FAKE_SERVER_API}/api/app-settings`;

const SETTINGS = makeSecuritySettings({ accessTokenExpireMinute: 30 });

describe('SettingsRepository with config loaded', () => {
    let repository: SettingsRepository;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: ConfigService, useValue: { urlWith: (sub: string) => `${FAKE_SERVER_API}${sub}` } }
            ]
        });

        repository = TestBed.inject(SettingsRepository);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('get fetches /api/app-settings with GET and resolves the entity', async () => {
        const done = firstValueFrom(repository.get());

        const req = await vi.waitFor(() => httpMock.expectOne(APP_SETTINGS_URL));
        expect(req.request.method).toBe('GET');
        req.flush(SETTINGS);

        expect(await done).toEqual(SETTINGS);
    });

    it('save posts the entity to /api/app-settings and resolves the stored entity', async () => {
        const done = firstValueFrom(repository.save(SETTINGS));

        const req = await vi.waitFor(() => httpMock.expectOne(APP_SETTINGS_URL));
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(SETTINGS);
        req.flush(SETTINGS);

        expect(await done).toEqual(SETTINGS);
    });
});

describe('SettingsRepository without config', () => {
    let repository: SettingsRepository;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting(), ConfigService]
        });

        repository = TestBed.inject(SettingsRepository);
    });

    it('get throws synchronously when the runtime config was not loaded yet', () => {
        expect(() => repository.get()).toThrow(/Configuration not loaded/);
    });

    it('save throws synchronously when the runtime config was not loaded yet', () => {
        expect(() => repository.save(SETTINGS)).toThrow(/Configuration not loaded/);
    });
});