import { Routes } from '@angular/router';
import { AppLayout } from './layout/component/app.layout';
import { Notfound } from './shared/pages/notfound';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        children: [
            // Placeholder until the real dashboard/security module lands
            { path: '', redirectTo: '/auth/login', pathMatch: 'full' }
        ]
    },
    { path: 'notfound', component: Notfound },
    { path: 'auth', loadChildren: () => import('./pages/auth/auth.routes') },
    { path: '**', redirectTo: '/notfound' }
];
