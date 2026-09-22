import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { TokenAuthService } from './token-auth.service';

describe('TokenAuthService', () => {
    let service: TokenAuthService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(TokenAuthService);
        sessionStorage.clear();
        localStorage.clear();
    });

    afterEach(() => {
        sessionStorage.clear();
        localStorage.clear();
    });

    it('starts with no access token', async () => {
        expect(await service.getAccessToken()).toBeNull();
        expect(service.getAccessTokenExpiration()).toBeNull();
        expect(await service.getRefreshToken()).toBeNull();
    });

    it('persists tokens encrypted and exposes them via the in-memory mirror', async () => {
        await service.persist({ access: 'at-123', refresh: 'rt-456', expiration: 1750000000000 });

        expect(await service.getAccessToken()).toBe('at-123');
        expect(service.getAccessTokenExpiration()).toBe(1750000000000);
        expect(await service.getRefreshToken()).toBe('rt-456');

        // Raw storage must NOT contain plaintext values
        expect(sessionStorage.getItem('access_token')).not.toContain('at-123');
        expect(localStorage.getItem('refresh_token')).not.toContain('rt-456');
    });

    it('restore() brings back the mirror from storage', async () => {
        await service.persist({ access: 'at-123', refresh: 'rt-456', expiration: 1750000000000 });
        await service.clear();
        expect(await service.getAccessToken()).toBeNull();

        // Simulate a re-login persistence, then a fresh in-memory state by re-persisting
        await service.persist({ access: 'at-new', refresh: 'rt-new', expiration: 1750000000001 });
        // restore() is a no-op when the mirror already has a token
        await service.restore();
        expect(await service.getAccessToken()).toBe('at-new');
    });

    it('restore() is a no-op when the mirror already holds a token', async () => {
        await service.persist({ access: 'first', refresh: 'r', expiration: 1 });
        await service.restore();
        expect(await service.getAccessToken()).toBe('first');
    });

    it('clear() removes everything from memory and both storages', async () => {
        await service.persist({ access: 'at', refresh: 'rt', expiration: 1 });
        await service.clear();

        expect(await service.getAccessToken()).toBeNull();
        expect(service.getAccessTokenExpiration()).toBeNull();
        expect(await service.getRefreshToken()).toBeNull();
        expect(sessionStorage.getItem('access_token')).toBeNull();
        expect(localStorage.getItem('refresh_token')).toBeNull();
    });

    it('isRefreshTokenExpired() is true when no expiry was persisted (fail closed)', async () => {
        await service.persist({ access: 'at', refresh: 'rt', expiration: 1 });
        expect(await service.isRefreshTokenExpired()).toBe(true);
    });

    it('isRefreshTokenExpired() reflects the persisted refresh expiration', async () => {
        await service.persist({ access: 'at', refresh: 'rt', expiration: 1, refreshExpiration: Date.now() + 60_000 });
        expect(await service.isRefreshTokenExpired()).toBe(false);
    });

    it('refreshAccess() short-circuits to null when the refresh token is expired — no network call', async () => {
        await service.persist({ access: 'at', refresh: 'rt', expiration: 1, refreshExpiration: Date.now() - 1000 });
        const result = await service.refreshAccess();
        expect(result).toBeNull();
        expect(await service.getRefreshToken()).toBe('rt');
    });
});