import { Routes } from '@angular/router';
import { CONST_ROUTES } from '@/app/core/constants/route-paths';

export const securityRoutes: Routes = [
    {
        path: CONST_ROUTES.roles, // "roles"  → /seguridad/roles
        loadChildren: () => import('./roles/roles.routes').then((m) => m.default),
        data: { title: 'Roles', breadcrumb: 'Roles' }
    },
    {
        path: CONST_ROUTES.configuracion, // "settings" → /seguridad/settings
        loadChildren: () => import('./settings/settings.routes').then((m) => m.default),
        data: { title: 'Configuración', breadcrumb: 'Configuración' }
    },
    {
        path: CONST_ROUTES.usuarios, // "users" → /seguridad/users
        loadChildren: () => import('./users/users.routes').then((m) => m.default),
        data: { title: 'Usuarios', breadcrumb: 'Usuarios' }
    },
    {
        path: CONST_ROUTES.auditorias, // "audits" → /seguridad/audits
        loadChildren: () => import('./audits/audit.routes').then((m) => m.default),
        data: { title: 'Auditoría', breadcrumb: 'Auditoría' }
    },

    // Redirección cuando se entra a /seguridad "pelado"
    { path: '', redirectTo: CONST_ROUTES.roles, pathMatch: 'full' },

    // Comodín SOLO dentro de /seguridad
    { path: '**', redirectTo: '/notfound' }
];
