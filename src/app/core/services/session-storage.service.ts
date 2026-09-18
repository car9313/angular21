import { Injectable, inject } from '@angular/core';
import { CryptoService } from './crypto.service';

/**
 * Typed, encrypted storage wrappers.
 *
 * - Session-scoped values (access token, current user) → sessionStorage,
 *   cleared when the browser tab closes.
 * - Persistent values (refresh token, device id) → localStorage.
 *
 * Everything is stored encrypted as an opaque string; values are JSON
 * serialized before encryption. All operations are async because encryption
 * uses the async Web Crypto API.
 */
@Injectable({ providedIn: 'root' })
export class SessionStorageService {
    private readonly crypto = inject(CryptoService);

    // ── Session-scoped (sessionStorage) ────────────────────────────────────

    async getSession<T>(key: string): Promise<T | null> {
        const raw = sessionStorage.getItem(key);

        if (raw === null) {
            return null;
        }

        try {
            return JSON.parse(await this.crypto.decrypt(raw)) as T;
        } catch {
            // Corrupted or foreign entry: treat as missing, never throw to consumers.
            this.removeSession(key);
            return null;
        }
    }

    async setSession<T>(key: string, value: T): Promise<void> {
        sessionStorage.setItem(key, await this.crypto.encrypt(JSON.stringify(value)));
    }

    removeSession(key: string): void {
        sessionStorage.removeItem(key);
    }

    clearSession(): void {
        sessionStorage.clear();
    }

    // ── Persistent (localStorage) ──────────────────────────────────────────

    async getPersistent<T>(key: string): Promise<T | null> {
        const raw = localStorage.getItem(key);

        if (raw === null) {
            return null;
        }

        try {
            return JSON.parse(await this.crypto.decrypt(raw)) as T;
        } catch {
            this.removePersistent(key);
            return null;
        }
    }

    async setPersistent<T>(key: string, value: T): Promise<void> {
        localStorage.setItem(key, await this.crypto.encrypt(JSON.stringify(value)));
    }

    removePersistent(key: string): void {
        localStorage.removeItem(key);
    }
}