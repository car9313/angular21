import { Routes } from '@angular/router';
import { UsersPage } from './presentation/users.page';
import { RESOURCES } from '../../../core/constants/resources';
import { ACTIONS } from '../../../core/constants/actions';

/**
 * Users module routes, mounted under /seguridad/usuarios.
 * resource + actions feed permissionGuard, declared on the parent layout
 * route in app.routes.ts — same contract as roles.
 */
export default [
    {
        path: 'usuarios',
        component: UsersPage,
        data: { title: 'Usuarios', breadcrumb: 'Usuarios', resource: RESOURCES.Users, actions: [ACTIONS.Read] }
    }
] as Routes;
