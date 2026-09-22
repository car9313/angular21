import { Routes } from '@angular/router';
import { AppLayout } from './layout/component/app.layout';
import { Notfound } from './shared/pages/notfound';
import { authGuard } from './core/guards/auth.guard';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        canActivate: [authGuard],
        canActivateChild: [authGuard],
        children: [
            { path: '', redirectTo: 'panel-principal', pathMatch: 'full' },
            {
                path: 'panel-principal',
                loadComponent: () => import('./pages/panel-principal').then((m) => m.PanelPrincipal),
                data: { title: 'Inicio', breadcrumb: 'Panel principal' }
            }
        ]
    },
    { path: 'notfound', component: Notfound },
    { path: 'auth', loadChildren: () => import('./pages/auth/auth.routes') },
    { path: '**', redirectTo: '/notfound' }
];
