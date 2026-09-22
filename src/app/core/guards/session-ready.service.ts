import { Injectable, inject } from '@angular/core';
import { SessionStore } from '../store/session.store';
import { RestoreSessionUseCase } from '../../modules/auth/application/restore-session.use-case';

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

    /**
     * Resolves when the session is in its definitive boot state
     * (restored or confirmed logged-out). Never rejects.
     */
    whenReady(): Promise<void> {
        this.readyPromise ??= this.restore.execute();
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
