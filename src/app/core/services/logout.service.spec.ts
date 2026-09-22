import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { ConfigService } from './config.service';
import { LogoutService } from './logout.service';
import { SessionStore } from '../store/session.store';
import { TokenAuthService } from './token-auth.service';

const FAKE_SERVER_API = 'http://test-api';

describe('LogoutService', () => {
    let service: LogoutService;
    let tokenAuth: TokenAuthService;
    let store: InstanceType<typeof SessionStore>;
    let httpMock: HttpTestingController;
    let navigate: Mock<Router['navigate']>;

    beforeEach(() => {
        navigate = vi.fn<Router['navigate']>().mockResolvedValue(true);

        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                provideRouter([]),
                { provide: ConfigService, useValue: { url: FAKE_SERVER_API } }
            ]
        });

        service = TestBed.inject(LogoutService);
        tokenAuth = TestBed.inject(TokenAuthService);
        store = TestBed.inject(SessionStore);
        httpMock = TestBed.inject(HttpTestingController);

        vi.spyOn(TestBed.inject(Router), 'navigate').mockImplementation(navigate);
        sessionStorage.clear();
        localStorage.clear();
        store.setUser(null);
    });

    afterEach(() => {
        httpMock.verify();
        sessionStorage.clear();
        localStorage.clear();
    });

    async function givenLoggedInSession(): Promise<void> {
        store.setUser({ id: '1', username: 'aruiz', fullName: 'Ana Ruiz', roles: ['Admin'] });
        store.setPermissions([{ resource: 'users', actions: ['Read'] }]);
        await tokenAuth.persist({ access: 'at-123', refresh: 'rt-456', expiration: 1750000000000 });
    }

    it('revokes the refresh token on the server and then clears the whole session', async () => {
        await givenLoggedInSession();

        const done = service.logout();

        const req = await vi.waitFor(() => httpMock.expectOne(`${FAKE_SERVER_API}/api/auth/logout`));
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ refreshToken: 'rt-456' });
        req.flush(null);

        await done;

        expect(await tokenAuth.getAccessToken()).toBeNull();
        expect(await tokenAuth.getRefreshToken()).toBeNull();
        expect(store.user()).toBeNull();
        expect(store.permissions()).toEqual([]);
        expect(navigate).toHaveBeenCalledWith(['/auth/login']);
    });

    it('clears the local session and navigates even when the server call fails', async () => {
        await givenLoggedInSession();

        const done = service.logout();

        const req = await vi.waitFor(() => httpMock.expectOne(`${FAKE_SERVER_API}/api/auth/logout`));
        req.flush('server exploded', { status: 500, statusText: 'Server Error' });

        await done;

        expect(await tokenAuth.getAccessToken()).toBeNull();
        expect(await tokenAuth.getRefreshToken()).toBeNull();
        expect(store.user()).toBeNull();
        expect(navigate).toHaveBeenCalledWith(['/auth/login']);
    });

    it('still revokes (with null refresh token), cleans up and navigates without a stored session', async () => {
        const done = service.logout();

        const req = await vi.waitFor(() => httpMock.expectOne(`${FAKE_SERVER_API}/api/auth/logout`));
        expect(req.request.body).toEqual({ refreshToken: null });
        req.flush(null);

        await done;

        expect(store.user()).toBeNull();
        expect(navigate).toHaveBeenCalledWith(['/auth/login']);
    });
});
