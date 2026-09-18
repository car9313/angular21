import { Injectable } from '@angular/core';

/**
 * AES-GCM encryption via the native Web Crypto API (no crypto-js dependency).
 *
 * DESIGN NOTE — being honest about what this provides:
 * The key material is derived from a passphrase that ships in the bundle, so
 * this is obfuscation at rest (against casual storage inspection), NOT real
 * security. Actual token security comes from the backend (short-lived access
 * tokens, refresh rotation, HTTPS). Never treat this layer as a security
 * boundary.
 */
@Injectable({ providedIn: 'root' })
export class CryptoService {
    private static readonly SALT = 'sakai-ng-v1-static-salt';

    private keyPromise: Promise<CryptoKey> | null = null;

    async encrypt(plain: string): Promise<string> {
        const key = await this.getKey();
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encoded = new TextEncoder().encode(plain);

        const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);

        return this.toBase64Url(new Uint8Array([...iv, ...new Uint8Array(cipher)]));
    }

    async decrypt(cipherText: string): Promise<string> {
        const key = await this.getKey();
        const raw = this.fromBase64Url(cipherText);
        const iv = raw.slice(0, 12);
        const data = raw.slice(12);

        const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);

        return new TextDecoder().decode(plain);
    }

    /**
     * Derives the AES-GCM key once (PBKDF2, 100k iterations) and caches it.
     * A static in-code passphrase is required because there is no server-side
     * KDF in scope; see the class note about the threat model.
     */
    private async getKey(): Promise<CryptoKey> {
        this.keyPromise ??= (async () => {
            const baseKey = await crypto.subtle.importKey('raw', new TextEncoder().encode('sakai-ng-client-secret'), 'PBKDF2', false, ['deriveKey']);

            return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: new TextEncoder().encode(CryptoService.SALT), iterations: 100_000, hash: 'SHA-256' }, baseKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
        })();

        return this.keyPromise;
    }

    private toBase64Url(bytes: Uint8Array): string {
        let binary = '';
        bytes.forEach((b) => (binary += String.fromCharCode(b)));

        return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    private fromBase64Url(text: string): Uint8Array {
        const base64 = text.replace(/-/g, '+').replace(/_/g, '/');
        const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4));

        return Uint8Array.from(binary, (c) => c.charCodeAt(0));
    }
}