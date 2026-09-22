import { Injectable, inject } from '@angular/core';
import { SessionStorageService } from '../../../core/services/session-storage.service';

const FINGERPRINT_KEY = 'fingerprint';

/**
 * Anonymous device identifier sent in the LOGIN request body only (reference
 * contract — the fingerprint never travels on refresh or on other requests).
 *
 * PERSISTENT, like the reference implementation: generated once and stored
 * in localStorage, then reused on every login. The backend uses it to
 * recognize "the same browser" — a fresh UUID per attempt makes every login
 * look like a NEW device and trips the server-side single-session rule
 * ("Existe una sesión activa desde otro navegador", HTTP 401).
 */
@Injectable({ providedIn: 'root' })
export class FingerprintService {
    private readonly storage = inject(SessionStorageService);

    private cached: string | null = null;

    async get(): Promise<string> {
        if (this.cached) {
            return this.cached;
        }

        const stored = await this.storage.getPersistent<string>(FINGERPRINT_KEY);
        if (stored) {
            this.cached = stored;
            return stored;
        }

        const fresh = crypto.randomUUID();
        await this.storage.setPersistent(FINGERPRINT_KEY, fresh);
        this.cached = fresh;
        return fresh;
    }
}
