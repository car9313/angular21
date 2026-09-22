import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionReadyService } from './session-ready.service';

/**
 * Inverse of authGuard: keeps authenticated users away from guest-only
 * pages (login). Redirects them to the app root.
 *
 * AWAITS session restoration first — otherwise an F5 landing directly on
 * /auth/login would briefly evaluate an empty store and let the user see
 * the login even though the session is valid.
 */
export const guestGuard: CanActivateFn = async () => {
    const sessionReady = inject(SessionReadyService);
    const router = inject(Router);

    await sessionReady.whenReady();

    return sessionReady.isHydrated ? router.createUrlTree(['/']) : true;
};
