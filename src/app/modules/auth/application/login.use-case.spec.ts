import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { LoginUseCase } from './login.use-case';
import { SessionStore } from '../../../core/store/session.store';
import { TokenAuthService } from '../../../core/services/token-auth.service';
import { FingerprintService } from '../infrastructure/fingerprint.service';
import { ConfigService } from '../../../core/services/config.service';

const LOGIN_URL = 'http://test-api/api/auth/login';
const CURRENT_USER_URL = 'http://test-api/api/auth/user/current';

describe('LoginUseCase', () => {
    let useCase: LoginUseCase;
    let store: InstanceType<typeof SessionStore>;
    let tokenAuth: TokenAuthService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                provideRouter([]),
                { provide: FingerprintService, useValue: { get: () => 'fp-123' } },
                { provide: ConfigService, useValue: { urlWith: (sub: string) => `http://test-api${sub}` } }
            ]
        });

        useCase = TestBed.inject(LoginUseCase);
        store = TestBed.inject(SessionStore);
        tokenAuth = TestBed.inject(TokenAuthService);
        httpMock = TestBed.inject(HttpTestingController);
        sessionStorage.clear();
        localStorage.clear();
    });

    afterEach(() => {
        httpMock.verify();
        sessionStorage.clear();
        localStorage.clear();
    });

    async function respondHappyPath(): Promise<void> {
        const loginReq = await vi.waitFor(() => httpMock.expectOne(LOGIN_URL));
        expect(loginReq.request.body).toEqual({ username: 'aruiz', password: 'secret', fingerprint: 'fp-123' });
        loginReq.flush({ accessToken: 'at-1', tokenType: 'Bearer', issuedAt: 'now', refreshToken: 'rt-1', expiresIn: 300, refreshTokenExpiresIn: '1d' });

        const userReq = await vi.waitFor(() => httpMock.expectOne(CURRENT_USER_URL));
        userReq.flush({
            id: '1',
            username: 'aruiz',
            fullName: 'Ana Ruiz',
            roles: [
                { name: 'Admin', permissions: [{ resource: 'users', actions: ['Read', 'Create'] }] },
                { name: 'Auditor', permissions: [{ resource: 'audits', actions: ['Read'] }] }
            ]
        });
    }

    it('persists tokens and hydrates the SessionStore with user and flattened permissions', async () => {
        const done = useCase.execute('aruiz', 'secret');
        await respondHappyPath();
        await done;

        // Identity + flattened permissions (role-embedded → flat catalog)
        expect(store.user()).toEqual({ id: '1', username: 'aruiz', fullName: 'Ana Ruiz', roles: ['Admin', 'Auditor'] });
        expect(store.permissions()).toEqual([
            { resource: 'users', actions: ['Read', 'Create'] },
            { resource: 'audits', actions: ['Read'] }
        ]);
        expect(store.hasPermission('users', ['Create'])).toBe(true);
        expect(store.hasPermission('audits', ['Read'])).toBe(true);
        expect(store.hasPermission('settings', ['Read'])).toBe(false);

        // Tokens persisted before the identity call (Bearer needed it)
        expect(await tokenAuth.getAccessToken()).toBe('at-1');
        expect(await tokenAuth.getRefreshToken()).toBe('rt-1');
    });

    it('does NOT touch the store when the login call fails', async () => {
        const done = useCase.execute('aruiz', 'wrong');

        const loginReq = await vi.waitFor(() => httpMock.expectOne(LOGIN_URL));
        loginReq.flush({ message: 'bad credentials' }, { status: 401, statusText: 'Unauthorized' });

        await expect(done).rejects.toThrow();
        expect(store.user()).toBeNull();
        expect(store.permissions()).toEqual([]);
        expect(await tokenAuth.getAccessToken()).toBeNull();
    });

    it('does NOT touch the store when the identity call fails after a successful login', async () => {
        const done = useCase.execute('aruiz', 'secret');

        const loginReq = await vi.waitFor(() => httpMock.expectOne(LOGIN_URL));
        loginReq.flush({ accessToken: 'at-1', tokenType: 'Bearer', issuedAt: 'now', refreshToken: 'rt-1', expiresIn: 300, refreshTokenExpiresIn: '1d' });

        const userReq = await vi.waitFor(() => httpMock.expectOne(CURRENT_USER_URL));
        userReq.flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });

        await expect(done).rejects.toThrow();
        expect(store.user()).toBeNull();
        expect(store.permissions()).toEqual([]);
    });
});
