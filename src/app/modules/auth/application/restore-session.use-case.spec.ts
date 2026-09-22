import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { RestoreSessionUseCase } from './restore-session.use-case';
import { SessionStore } from '../../../core/store/session.store';
import { TokenAuthService } from '../../../core/services/token-auth.service';
import { ConfigService } from '../../../core/services/config.service';
import { authInterceptor } from '../../../core/interceptors/auth.interceptor';

const CURRENT_USER_URL = 'http://test-api/api/auth/user/current';

describe('RestoreSessionUseCase', () => {
    let useCase: RestoreSessionUseCase;
    let store: InstanceType<typeof SessionStore>;
    let tokenAuth: TokenAuthService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withInterceptors([authInterceptor])),
                provideHttpClientTesting(),
                provideRouter([]),
                { provide: ConfigService, useValue: { urlWith: (sub: string) => `http://test-api${sub}` } }
            ]
        });

        useCase = TestBed.inject(RestoreSessionUseCase);
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

    it('is a no-op (logged-out state) when storage holds no access token', async () => {
        await useCase.execute();

        expect(store.user()).toBeNull();
        expect(store.permissions()).toEqual([]);
        expect(await tokenAuth.getAccessToken()).toBeNull(); // restore() ran, nothing to restore
    });

    it('re-fetches identity and hydrates the store when a token is present (F5 scenario)', async () => {
        await tokenAuth.persist({ access: 'at-1', refresh: 'rt-1', expiration: Date.now() + 60_000, refreshExpiration: Date.now() + 600_000 });

        const done = useCase.execute();

        const req = await vi.waitFor(() => httpMock.expectOne((r) => r.url === CURRENT_USER_URL));
        expect(req.request.headers.get('Authorization')).toBe('Bearer at-1');
        req.flush({
            id: '1',
            username: 'aruiz',
            fullName: 'Ana Ruiz',
            roles: [{ name: 'Admin', permissions: [{ resource: 'users', actions: ['Read'] }] }]
        });

        await done;

        expect(store.user()).toEqual({ id: '1', username: 'aruiz', fullName: 'Ana Ruiz', roles: ['Admin'] });
        expect(store.permissions()).toEqual([{ resource: 'users', actions: ['Read'] }]);
    });

    it('fails closed (clears tokens + resets store) when the identity call fails', async () => {
        await tokenAuth.persist({ access: 'stale', refresh: 'rt', expiration: Date.now() + 60_000, refreshExpiration: Date.now() + 600_000 });

        const done = useCase.execute();

        const req = await vi.waitFor(() => httpMock.expectOne((r) => r.url === CURRENT_USER_URL));
        // 500 (not 401): a 401 would engage the interceptor's refresh flow
        // and leave a pending refresh-token request in the mock. The use-case
        // fails closed on ANY identity failure, so 500 covers the contract.
        req.flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });

        await done;

        expect(store.user()).toBeNull();
        expect(store.permissions()).toEqual([]);
        expect(await tokenAuth.getAccessToken()).toBeNull();
        expect(await tokenAuth.getRefreshToken()).toBeNull();
    });
});
