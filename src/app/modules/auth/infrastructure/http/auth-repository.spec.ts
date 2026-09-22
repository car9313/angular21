import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthRepository } from './auth-repository';
import { SessionUserDto } from '../../domain/auth-response-body';
import { ConfigService } from '../../../../core/services/config.service';

const FAKE_SERVER_API = 'http://test-api';
const LOGIN_URL = `${FAKE_SERVER_API}/api/auth/login`;
const CURRENT_USER_URL = `${FAKE_SERVER_API}/api/auth/user/current`;

const USER_DTO: SessionUserDto = {
    id: '1',
    username: 'aruiz',
    fullName: 'Ana Ruiz',
    roles: [{ name: 'Admin', permissions: [{ resource: 'users', actions: ['Read'] }] }]
};

describe('AuthRepository', () => {
    let repository: AuthRepository;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: ConfigService, useValue: { urlWith: (sub: string) => `${FAKE_SERVER_API}${sub}` } }
            ]
        });

        repository = TestBed.inject(AuthRepository);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('login posts credentials to /api/auth/login and unwraps the body', async () => {
        const done = repository.login({ username: 'aruiz', password: 'secret', fingerprint: 'fp-1' });

        const req = await vi.waitFor(() => httpMock.expectOne(LOGIN_URL));
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ username: 'aruiz', password: 'secret', fingerprint: 'fp-1' });
        req.flush({ accessToken: 'at', tokenType: 'Bearer', issuedAt: 'now', refreshToken: 'rt', expiresIn: 300, refreshTokenExpiresIn: '1d' });

        const body = await done;
        expect(body.accessToken).toBe('at');
        expect(body.refreshToken).toBe('rt');
    });

    it('login throws when the response has no body', async () => {
        const done = repository.login({ username: 'u', password: 'p', fingerprint: 'fp' });

        const req = await vi.waitFor(() => httpMock.expectOne(LOGIN_URL));
        req.flush(null, { status: 204, statusText: 'No Content' });

        await expect(done).rejects.toThrow('empty response body');
    });

    it('getCurrentUser fetches the identity with a plain GET (Bearer via interceptor)', async () => {
        const done = repository.getCurrentUser();

        const req = await vi.waitFor(() => httpMock.expectOne(CURRENT_USER_URL));
        expect(req.request.method).toBe('GET');
        req.flush(USER_DTO);

        const user = await done;
        expect(user.roles[0].permissions[0].resource).toBe('users');
    });
});
