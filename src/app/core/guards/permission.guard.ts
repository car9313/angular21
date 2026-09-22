import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionStore } from '../store/session.store';
import { ACTIONS } from '../constants/actions';

interface PermissionGuardData {
    resource?: string;
    actions?: string[];
}

/**
 * Route permission gate driven by route data:
 *   data: { resource: 'users', actions: ['Read', 'Update'] }
 *
 * Contract (mirrors the reference implementation):
 * - `resource: 'Public'`  → universally allowed (magic string used to
 *   declare public routes explicitly, ported from the reference project).
 * - No `resource` in data  → also treated as public (defense-in-depth).
 * - Resource without actions → requires Read by default (closes the gap of
 *   protected routes declared without explicit actions).
 * - Permission denied → redirect to the access-denied page.
 */
export const permissionGuard: CanActivateFn = (route) => {
    const data = route.data as PermissionGuardData;

    if (!data.resource || data.resource === 'Public') {
        return true;
    }

    const session = inject(SessionStore);
    const actions = data.actions?.length ? data.actions : [ACTIONS.Read];

    if (session.hasPermission(data.resource, actions)) {
        return true;
    }

    return inject(Router).createUrlTree(['/auth/access']);
};