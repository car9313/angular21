import { Routes } from '@angular/router';
import { RolesPage } from './presentation/roles.page';
import { RESOURCES } from '../../../core/constants/resources';
import { ACTIONS } from '../../../core/constants/actions';

/**
 * Roles module routes, mounted under /seguridad/roles.
 * resource + actions feed the permissionGuard (declared on the parent route).
 */
export default [
    {
        path: 'roles',
        component: RolesPage,
        data: { title: 'Roles', breadcrumb: 'Roles', resource: RESOURCES.Roles, actions: [ACTIONS.Read] }
    }
] as Routes;