import { describe, it, expect, beforeEach } from 'vitest';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, Routes } from '@angular/router';
import { PageTitleService } from './page-title.service';

@Component({ template: '', standalone: true })
class StubPage {}

const routes: Routes = [
    {
        path: 'seguridad',
        data: { title: 'Seguridad' },
        children: [
            { path: 'usuarios', component: StubPage, data: { title: 'Usuarios' } },
            { path: 'auditorias', component: StubPage }
        ]
    },
    { path: '**', redirectTo: 'seguridad/usuarios' }
];

describe('PageTitleService', () => {
    let service: PageTitleService;
    let router: Router;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideRouter(routes)]
        });
        router = TestBed.inject(Router);
        service = TestBed.inject(PageTitleService);
    });

    it('starts empty', () => {
        expect(service.title()).toBe('');
    });

    it('resolves the deepest route title', async () => {
        await router.navigateByUrl('/seguridad/usuarios');

        expect(service.title()).toBe('Usuarios');
    });

    it('inherits the parent title when the leaf has none (accumulated data)', async () => {
        await router.navigateByUrl('/seguridad/auditorias');

        expect(service.title()).toBe('Seguridad');
    });

    it('setTitle overrides until the next navigation resets it', async () => {
        await router.navigateByUrl('/seguridad/usuarios');
        service.setTitle('Detalle de usuario');
        expect(service.title()).toBe('Detalle de usuario');

        await router.navigateByUrl('/seguridad/auditorias');
        expect(service.title()).toBe('Seguridad');
    });
});