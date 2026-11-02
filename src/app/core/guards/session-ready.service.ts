import { Injectable, inject } from '@angular/core';
import { SessionStore } from '../store/session.store';
import { RestoreSessionUseCase } from '../../modules/auth/application/restore-session.use-case';
import { ConfigService } from '@/app/core/services/config.service';

/**
 * One-shot session-restoration barrier for the auth guards.
 *
 * On a full page reload (F5) the guards run BEFORE any in-flight boot work
 * could hydrate the SessionStore — the authGuard then bounces an
 * authenticated user to /auth/login (the reported "weird URL with
 * ?returnUrl=") even though the tokens and the identity call (current → 200)
 * are fine. This barrier awaits the boot-time RestoreSessionUseCase exactly
 * ONCE per app lifetime: the first guard to run triggers the restore; every
 * other guard (and every later navigation) awaits the same settled promise.
 * Mirrors the reference project's self-healing guard (ensureLoggedIn) without
 * duplicating restore work per navigation.
 */
@Injectable({ providedIn: 'root' })
export class SessionReadyService {
    private readonly session = inject(SessionStore);
    private readonly restore = inject(RestoreSessionUseCase);

    private readyPromise: Promise<void> | null = null;
    private readonly config = inject(ConfigService);
    /**
     * Resolves when the session is in its definitive boot state
     * (restored or confirmed logged-out). Never rejects.
     */
    whenReady(): Promise<void> {
        this.readyPromise ??= (async () => {
            // El appInitializer de config y el de withEnabledBlockingInitialNavigation
            // corren en PARALELO (Promise.all en Angular). Sin este await, el guard
            // toca la API antes de que ConfigService tenga serverApi, y urlWith
            // lanza sin mandar request.
            await this.config.whenLoaded();
            await this.restore.execute();
        })();
        return this.readyPromise;
    }

    /** Test hook: clears the one-shot barrier. */
    reset(): void {
        this.readyPromise = null;
    }

    get isHydrated(): boolean {
        return this.session.user() !== null;
    }
}
