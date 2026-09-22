import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpBackend } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { ConfigService } from './config.service';
import { SessionStorageService } from './session-storage.service';
import { expiryFromLifetime } from '../utils/token-expiry';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const TOKEN_EXPIRATION_KEY = 'access_token_expiration';

/** Wire contract of the refresh endpoint (reference backend). */
interface RefreshResponseBody {
    accessToken: string;
    tokenType: string;
    /** Access token lifetime in MINUTES (see core/utils/token-expiry). */
    expiresIn: number;
}

interface StoredTokens {
    access: string;
    refresh: string;
    /** Epoch milliseconds when the access token expires. */
    expiration: number;
    /** Epoch milliseconds when the refresh token expires (if known). */
    refreshExpiration?: number;
}

/**
 * Token lifecycle: storage (encrypted), in-memory mirror for synchronous
 * consumers (interceptor), single-flight refresh, and clearing on logout.
 *
 * The refresh call uses a raw HttpBackend client on purpose: it must BYPASS
 * every interceptor, otherwise a rejected refresh would re-enter this same
 * interceptor and loop forever.
 *
 * This service knows NOTHING about user identity or permissions — those
 * belong to the SessionStore. One responsibility, one owner.
 */
@Injectable({ providedIn: 'root' })
export class TokenAuthService {
    private readonly storage = inject(SessionStorageService);
    private readonly config = inject(ConfigService);
    private readonly rawHttp = new HttpClient(inject(HttpBackend));

    /** In-memory mirror: the interceptor reads this without async IO. */
    private readonly accessTokenSignal = signal<string | null>(null);

    private readonly accessTokenExpirationSignal = signal<number | null>(null);

    /**
     * Synchronous accessor for hot paths (the interceptor attaches the
     * Bearer header per request without an async hop).
     */
    accessToken(): string | null {
        return this.accessTokenSignal();
    }

    async getAccessToken(): Promise<string | null> {
        return this.accessTokenSignal();
    }

    getAccessTokenExpiration(): number | null {
        return this.accessTokenExpirationSignal();
    }

    async getRefreshToken(): Promise<string | null> {
        return (await this.storage.getPersistent<StoredTokens>(REFRESH_TOKEN_KEY))?.refresh ?? null;
    }

    /**
     * True when the refresh token is known to be expired (or its expiry is
     * unknown — fail closed). Tracks the login response's `refreshTokenExpiresIn`
     * (MINUTES — backend contract, confirmed 2026-09-22; the body is the
     * source of truth), persisted alongside the token so refresh() can
     * short-circuit before a doomed network call.
     */
    async isRefreshTokenExpired(): Promise<boolean> {
        const stored = await this.storage.getPersistent<StoredTokens>(REFRESH_TOKEN_KEY);
        if (!stored?.refreshExpiration) {
            return true;
        }
        return Date.now() > stored.refreshExpiration;
    }

    async persist(tokens: { access: string; refresh: string; expiration: number; refreshExpiration?: number }): Promise<void> {
        this.accessTokenSignal.set(tokens.access);
        this.accessTokenExpirationSignal.set(tokens.expiration);

        await this.storage.setSession(ACCESS_TOKEN_KEY, tokens.access);
        await this.storage.setSession(TOKEN_EXPIRATION_KEY, tokens.expiration);
        await this.storage.setPersistent(REFRESH_TOKEN_KEY, { access: tokens.access, refresh: tokens.refresh, expiration: tokens.expiration, ...(tokens.refreshExpiration !== undefined ? { refreshExpiration: tokens.refreshExpiration } : {}) });
    }

    /**
     * Single-flight refresh: POSTs the refresh token to the backend and
     * updates only the access token (the refresh token is NOT rotated by
     * this endpoint). Resolves the new access token, or null on failure.
     */
    async refreshAccess(): Promise<string | null> {
        const refreshToken = await this.getRefreshToken();

        if (!refreshToken) {
            return null;
        }

        if (await this.isRefreshTokenExpired()) {
            return null;
        }

        try {
            const body = await lastValueFrom(this.rawHttp.post<RefreshResponseBody>(`${this.config.url}/api/auth/refresh-token`, { RefreshToken: refreshToken }));

            const expiration = expiryFromLifetime(body.expiresIn);
            this.accessTokenSignal.set(body.accessToken);
            this.accessTokenExpirationSignal.set(expiration);
            await this.storage.setSession(ACCESS_TOKEN_KEY, body.accessToken);
            await this.storage.setSession(TOKEN_EXPIRATION_KEY, expiration);

            const stored = await this.storage.getPersistent<StoredTokens>(REFRESH_TOKEN_KEY);
            if (stored) {
                await this.storage.setPersistent(REFRESH_TOKEN_KEY, { ...stored, access: body.accessToken, expiration });
            }

            return body.accessToken;
        } catch {
            return null;
        }
    }

    /**
     * Restores the in-memory mirror from storage at app boot.
     * Idempotent and safe to call multiple times.
     */
    async restore(): Promise<void> {
        if (this.accessTokenSignal()) {
            return;
        }

        const access = await this.storage.getSession<string>(ACCESS_TOKEN_KEY);
        const expiration = await this.storage.getSession<number>(TOKEN_EXPIRATION_KEY);

        if (access) {
            this.accessTokenSignal.set(access);
            this.accessTokenExpirationSignal.set(expiration);
        }
    }

    async clear(): Promise<void> {
        this.accessTokenSignal.set(null);
        this.accessTokenExpirationSignal.set(null);
        this.storage.removeSession(ACCESS_TOKEN_KEY);
        this.storage.removeSession(TOKEN_EXPIRATION_KEY);
        this.storage.removePersistent(REFRESH_TOKEN_KEY);
    }
}