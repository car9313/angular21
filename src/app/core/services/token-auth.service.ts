import { Injectable, inject, signal } from '@angular/core';
import { SessionStorageService } from './session-storage.service';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const TOKEN_EXPIRATION_KEY = 'access_token_expiration';

interface StoredTokens {
    access: string;
    refresh: string;
    /** Epoch milliseconds when the access token expires. */
    expiration: number;
}

/**
 * Token lifecycle: storage (encrypted), in-memory mirror for synchronous
 * consumers (interceptor), and clearing on logout.
 *
 * This service knows NOTHING about the user identity or permissions — those
 * belong to the SessionStore. One responsibility, one owner.
 */
@Injectable({ providedIn: 'root' })
export class TokenAuthService {
    private readonly storage = inject(SessionStorageService);

    /** In-memory mirror: the interceptor reads this without async IO. */
    private readonly accessToken = signal<string | null>(null);

    private readonly accessTokenExpiration = signal<number | null>(null);

    async getAccessToken(): Promise<string | null> {
        return this.accessToken();
    }

    getAccessTokenExpiration(): number | null {
        return this.accessTokenExpiration();
    }

    async getRefreshToken(): Promise<string | null> {
        return (await this.storage.getPersistent<StoredTokens>(REFRESH_TOKEN_KEY))?.refresh ?? null;
    }

    async persist(tokens: { access: string; refresh: string; expiration: number }): Promise<void> {
        this.accessToken.set(tokens.access);
        this.accessTokenExpiration.set(tokens.expiration);

        await this.storage.setSession(ACCESS_TOKEN_KEY, tokens.access);
        await this.storage.setSession(TOKEN_EXPIRATION_KEY, tokens.expiration);
        await this.storage.setPersistent(REFRESH_TOKEN_KEY, { access: tokens.access, refresh: tokens.refresh, expiration: tokens.expiration });
    }

    /**
     * Restores the in-memory mirror from storage at app boot.
     * Idempotent and safe to call multiple times.
     */
    async restore(): Promise<void> {
        if (this.accessToken()) {
            return;
        }

        const access = await this.storage.getSession<string>(ACCESS_TOKEN_KEY);
        const expiration = await this.storage.getSession<number>(TOKEN_EXPIRATION_KEY);

        if (access) {
            this.accessToken.set(access);
            this.accessTokenExpiration.set(expiration);
        }
    }

    async clear(): Promise<void> {
        this.accessToken.set(null);
        this.accessTokenExpiration.set(null);
        this.storage.removeSession(ACCESS_TOKEN_KEY);
        this.storage.removeSession(TOKEN_EXPIRATION_KEY);
        this.storage.removePersistent(REFRESH_TOKEN_KEY);
    }
}