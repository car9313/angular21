import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionReadyService } from './session-ready.service';

/**
 * Blocks navigation for unauthenticated users. Redirects to the login page
 * preserving the attempted URL as a returnUrl query parameter.
 *
 * AWAITS session restoration first: on F5 the store starts empty even for a
 * valid session; deciding before the boot restore completes would bounce an
 * authenticated user to the login (the reported blank/login bounce bug).
 */
export const authGuard: CanActivateFn = async (_route, state) => {
    const sessionReady = inject(SessionReadyService);
    const router = inject(Router);

    await sessionReady.whenReady();

    if (sessionReady.isHydrated) {
        return true;
    }

    return router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });
};
