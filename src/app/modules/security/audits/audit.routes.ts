
import { RESOURCES } from '../../../core/constants/resources';
import { ACTIONS } from '../../../core/constants/actions';
import { AuditPage } from '@/app/modules/security/audits/presentation/audit.page';
import { Routes } from '@angular/router';

/**
 * Audits module routes, mounted under /seguridad/auditorias.
 * resource + actions feed permissionGuard, declared on the parent layout
 * route in app.routes.ts — canActivateChild guards receive this child route's
 * data, and authGuard (same array, first position) has already awaited
 * session hydration before the permission check runs.
 */
export default [
    {
        path: '',
        component: AuditPage,
        data: { title: 'Auditoría', breadcrumb: 'Auditorías', resource: RESOURCES.Audits, actions: [ACTIONS.Read] }
    }
] as Routes;
