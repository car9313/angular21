import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionStore } from '../store/session.store';

/**
 * Blocks navigation for unauthenticated users. Redirects to the login page
 * preserving the attempted URL as a returnUrl query parameter.
 */
export const authGuard: CanActivateFn = (_route, state) => {
    const session = inject(SessionStore);
    const router = inject(Router);

    if (session.isAuthenticated()) {
        return true;
    }

    return router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });
};
