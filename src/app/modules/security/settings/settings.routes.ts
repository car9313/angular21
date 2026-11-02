import { Routes } from '@angular/router';
import { SettingsPage } from './presentation/settings.page';
import { RESOURCES } from '../../../core/constants/resources';
import { ACTIONS } from '../../../core/constants/actions';

/**
 * Settings module routes, mounted under /seguridad/configuracion.
 * resource + actions feed permissionGuard, declared on the parent layout
 * route in app.routes.ts.
 */
export default [
    {
        path: '',
        component: SettingsPage,
        data: { title: 'Configuración', breadcrumb: 'Configuración', resource: RESOURCES.SecConfig, actions: [ACTIONS.Update] }
    }
] as Routes;
