import { describe, it, expect, beforeEach } from 'vitest';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, Routes } from '@angular/router';
import { BreadcrumbService } from './breadcrumbs.service';

@Component({ template: '', standalone: true })
class StubPage {}

const routes: Routes = [
    {
        path: 'seguridad',
        data: { breadcrumb: 'Seguridad' },
        children: [
            { path: 'usuarios', component: StubPage, data: { breadcrumb: 'Usuarios' } },
            { path: 'usuarios/:id', component: StubPage, data: { breadcrumb: 'Usuario {{id}}', breadcrumbUrl: '/seguridad/usuarios' } },
            {
                path: 'consultas',
                children: [{ path: 'historial', component: StubPage, data: { breadcrumb: 'Historial' } }]
            }
        ]
    },
    { path: '**', redirectTo: 'seguridad/usuarios' }
];

describe('BreadcrumbService', () => {
    let service: BreadcrumbService;
    let router: Router;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideRouter(routes)]
        });
        router = TestBed.inject(Router);
        service = TestBed.inject(BreadcrumbService);
    });

    it('starts empty on the root route', () => {
        expect(service.breadcrumbs()).toEqual([]);
    });

    it('builds one crumb per route data without duplication from ancestor data', async () => {
        await router.navigateByUrl('/seguridad/usuarios');

        expect(service.breadcrumbs()).toEqual([
            { label: 'Seguridad' },
            { label: 'Usuarios', url: '/seguridad/usuarios' }
        ]);
    });

    it('interpolates {{param}} tokens and honors the custom breadcrumbUrl', async () => {
        await router.navigateByUrl('/seguridad/usuarios/42');

        const crumbs = service.breadcrumbs();
        expect(crumbs[crumbs.length - 1]).toEqual({ label: 'Usuario 42', url: '/seguridad/usuarios' });
    });

    it('treats component-less groups as plain text crumbs', async () => {
        await router.navigateByUrl('/seguridad/consultas/historial');

        expect(service.breadcrumbs()).toEqual([
            { label: 'Seguridad' },
            { label: 'Historial', url: '/seguridad/consultas/historial' }
        ]);
    });
});