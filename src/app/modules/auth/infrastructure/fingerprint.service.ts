import { Injectable } from '@angular/core';

/**
 * Anonymous identifier sent in the LOGIN request body only (reference
 * contract — the fingerprint never travels on refresh or on other requests).
 *
 * Mirrors the reference implementation: a fresh UUID per login attempt.
 * No persistence, no device fingerprinting — the backend only needs a string.
 */
@Injectable({ providedIn: 'root' })
export class FingerprintService {
    get(): string {
        return crypto.randomUUID();
    }
}