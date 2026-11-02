import { Routes } from '@angular/router';
import { AppLayout } from './layout/component/app.layout';
import { Notfound } from './shared/pages/notfound';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';
import { guestGuard } from '@/app/core/guards/guest.guard';
import { CONST_ROUTES } from '@/app/core/constants/route-paths';

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
                path: CONST_ROUTES.panelPrincipal,
                loadComponent: () => import('./pages/panel-principal/panel-principal').then((m) => m.PanelPrincipal),
                data: { title: 'Inicio', breadcrumb: 'Panel principal' }
            },

            {
                path: CONST_ROUTES.nomencladores,
                loadChildren: () => import('./modules/nomenclators/nomenclators.routes').then((m) => m.nomenclatorRoutes),
                data: {
                    breadcrumb: 'Nomencladores'
                }
            },
            {
                path: CONST_ROUTES.seguridad,
                loadChildren: () => import('./modules/security/security.routes').then((m) => m.securityRoutes),
                data: {
                    breadcrumb: 'Seguridad'
                }
            },
            {
                path: CONST_ROUTES.perfil,
                loadComponent: () => import('./modules/user-profile/user-profile.component').then((m) => m.UserProfileComponent),
                data: {
                    breadcrumb: 'Mi Perfil',
                    title: 'Mi Perfil'
                }
            }
        ]
    },
    {
        path: `${CONST_ROUTES.cambiarContrasena}/:token`,
        loadComponent: () => import('./modules/change-password/presentation/pages/change-password.component').then((m) => m.ChangePasswordComponent),
        canActivate: [guestGuard], // o un guard dedicado
        data: { title: 'Cambiar contraseña' }
        // SIN resource/actions → sin permissionGuard
    },
    { path: 'notfound', component: Notfound },
    { path: 'auth', loadChildren: () => import('./pages/auth/auth.routes') },
    { path: '**', redirectTo: '/notfound' }
];
