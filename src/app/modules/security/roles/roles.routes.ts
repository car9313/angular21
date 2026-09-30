import { Routes } from '@angular/router';
import { RolesPage } from './presentation/roles.page';
import { RESOURCES } from '../../../core/constants/resources';
import { ACTIONS } from '../../../core/constants/actions';

/**
 * Roles module routes, mounted under /seguridad/roles.
 * resource + actions feed permissionGuard, declared on the parent layout
 * route in app.routes.ts — canActivateChild guards receive this child route's
 * data, and authGuard (same array, first position) has already awaited
 * session hydration before the permission check runs.
 */
export default [
    {
        path: 'roles',
        component: RolesPage,
        data: { title: 'Roles', breadcrumb: 'Roles', resource: RESOURCES.Roles, actions: [ACTIONS.Read] }
    }
] as Routes;