import { Routes } from '@angular/router';
import { AppLayout } from './layout/component/app.layout';
import { Notfound } from './shared/pages/notfound';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        canActivate: [authGuard],
        // Angular passes the CHILD route snapshot to canActivateChild guards,
        // so permissionGuard reads each child's data ({ resource, actions }).
        // authGuard runs first: it awaits session hydration, which guarantees
        // permissionGuard evaluates against loaded permissions (no false
        // negatives on a cold F5).
        canActivateChild: [authGuard, permissionGuard],
        children: [
            { path: '', redirectTo: 'panel-principal', pathMatch: 'full' },
            {
                path: 'panel-principal',
                loadComponent: () => import('./pages/panel-principal').then((m) => m.PanelPrincipal),
                data: { title: 'Inicio', breadcrumb: 'Panel principal' }
            },
            {
                path: 'seguridad',
                loadChildren: () => import('./modules/security/roles/roles.routes').then((m) => m.default),
                data: { title: 'Seguridad' }
            }
        ]
    },
    { path: 'notfound', component: Notfound },
    { path: 'auth', loadChildren: () => import('./pages/auth/auth.routes') },
    { path: '**', redirectTo: '/notfound' }
];
