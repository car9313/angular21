import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { TokenAuthService } from '../services/token-auth.service';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('authInterceptor', () => {
    let client: HttpClient;
    let http: HttpTestingController;
    let router: Router;
    let tokenAuth: TokenAuthService;
    let navigateByUrl: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        const fake = {
            accessToken: vi.fn().mockReturnValue(null),
            getAccessToken: vi.fn(),
            getAccessTokenExpiration: vi.fn(),
            getRefreshToken: vi.fn(),
            persist: vi.fn(),
            restore: vi.fn(),
            refreshAccess: vi.fn(),
            clear: vi.fn().mockResolvedValue(undefined)
        };

        TestBed.configureTestingModule({
            providers: [provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting(), provideRouter([]), { provide: TokenAuthService, useValue: fake }]
        });

        client = TestBed.inject(HttpClient);
        http = TestBed.inject(HttpTestingController);
        router = TestBed.inject(Router);
        tokenAuth = TestBed.inject(TokenAuthService);
        navigateByUrl = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true) as ReturnType<typeof vi.spyOn>;
    });

    afterEach(() => {
        http.verify();
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    it('attaches the Bearer header when a token is present', async () => {
        tokenAuth.accessToken = vi.fn().mockReturnValue('tok-123') as typeof tokenAuth.accessToken;
        const promise = lastValueFrom(client.get('http://api.test/api/v1/people'));

        const req = http.expectOne('http://api.test/api/v1/people');
        expect(req.request.headers.get('Authorization')).toBe('Bearer tok-123');
        req.flush([{ id: 1 }]);

        await expect(promise).resolves.toEqual([{ id: 1 }]);
    });

    it('sends no Authorization header without a token', async () => {
        const promise = lastValueFrom(client.get('http://api.test/api/v1/people'));

        const req = http.expectOne('http://api.test/api/v1/people');
        expect(req.request.headers.get('Authorization')).toBeNull();
        req.flush([]);

        await promise;
    });

    it('never touches auth URLs (no header, no 401 refresh)', async () => {
        tokenAuth.accessToken = vi.fn().mockReturnValue('tok') as typeof tokenAuth.accessToken;
        const promise = lastValueFrom(client.get('/assets/config.development.json')).catch((e) => e);

        http.expectOne('/assets/config.development.json').flush({ serverApi: 'x' });
        await expect(promise).resolves.toEqual({ serverApi: 'x' });
        expect(tokenAuth.refreshAccess).not.toHaveBeenCalled();
    });

    it('clears the session and redirects to login on 418', async () => {
        const promise = lastValueFrom(client.get('http://api.test/api/v1/people')).catch((e) => e as HttpErrorResponse);

        http.expectOne('http://api.test/api/v1/people').flush({}, { status: 418, statusText: 'Forced logout' });

        const error = await promise;
        expect((error as HttpErrorResponse).status).toBe(418);
        expect(tokenAuth.clear).toHaveBeenCalled();
        expect(navigateByUrl).toHaveBeenCalledWith('/auth/login');
    });

    it('redirects to access-denied on 403 and preserves the original error', async () => {
        const body = { detail: 'forbidden' };
        const promise = lastValueFrom(client.get('http://api.test/api/v1/people')).catch((e) => e as HttpErrorResponse);

        const req = http.expectOne('http://api.test/api/v1/people');
        req.flush(body, { status: 403, statusText: 'Forbidden' });

        const error = await promise;
        expect(navigateByUrl).toHaveBeenCalledWith('/auth/access');
        expect((error as HttpErrorResponse).status).toBe(403);
        expect((error as HttpErrorResponse).error).toEqual(body);
    });

    it('runs a single refresh for parallel 401s and retries both with the new token', async () => {
        tokenAuth.accessToken = vi.fn().mockReturnValue('tok-old') as typeof tokenAuth.accessToken;
        tokenAuth.refreshAccess = vi.fn(async () => {
            await delay(10);
            return 'tok-new';
        }) as typeof tokenAuth.refreshAccess;

        const first = lastValueFrom(client.get('http://api.test/a')).catch((e) => e);
        const second = lastValueFrom(client.get('http://api.test/b')).catch((e) => e);

        http.expectOne('http://api.test/a').flush({}, { status: 401, statusText: 'Unauthorized' });
        http.expectOne('http://api.test/b').flush({}, { status: 401, statusText: 'Unauthorized' });

        expect(tokenAuth.refreshAccess).toHaveBeenCalledTimes(1);

        // Let the pending refresh resolve before expecting the retried requests.
        await delay(20);

        http.expectOne((r) => r.url === 'http://api.test/a' && r.headers.get('Authorization') === 'Bearer tok-new').flush({ ok: true });
        http.expectOne((r) => r.url === 'http://api.test/b' && r.headers.get('Authorization') === 'Bearer tok-new').flush({ ok: true });

        await expect(first).resolves.toEqual({ ok: true });
        await expect(second).resolves.toEqual({ ok: true });
    });

    it('clears, redirects and preserves the original 401 error when the refresh fails', async () => {
        tokenAuth.accessToken = vi.fn().mockReturnValue('tok-expired') as typeof tokenAuth.accessToken;
        tokenAuth.refreshAccess = vi.fn().mockResolvedValue(null) as typeof tokenAuth.refreshAccess;
        const body = { detail: 'token expired' };

        const promise = lastValueFrom(client.get('http://api.test/api/v1/people')).catch((e) => e as HttpErrorResponse);
        http.expectOne('http://api.test/api/v1/people').flush(body, { status: 401, statusText: 'Unauthorized' });

        // The refresh resolves immediately with null; give the subscription
        // pipeline one beat so the retried request (or the redirect) settles.
        await delay(20);

        const error = await promise;
        expect(tokenAuth.refreshAccess).toHaveBeenCalledTimes(1);
        expect(tokenAuth.clear).toHaveBeenCalled();
        expect(navigateByUrl).toHaveBeenCalledWith('/auth/login');
        expect((error as HttpErrorResponse).status).toBe(401);
        expect((error as HttpErrorResponse).error).toEqual(body);
    });
});