import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionStore } from '../store/session.store';

/**
 * Inverse of authGuard: keeps authenticated users away from guest-only
 * pages (login). Redirects them to the app root.
 */
export const guestGuard: CanActivateFn = () => {
    const session = inject(SessionStore);
    const router = inject(Router);

    return session.isAuthenticated() ? router.createUrlTree(['/']) : true;
};
