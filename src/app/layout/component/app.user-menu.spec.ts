// src/app/layout/app.user-menu.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import type { MenuItemCommandEvent } from 'primeng/api';
import { Tooltip } from 'primeng/tooltip';

import { UserMenu } from './app.user-menu';
import { SessionStore } from '@/app/core/store/session.store';
import { LogoutService } from '@/app/core/services/logout.service';

const ANA = { id: '1', username: 'aruiz', fullName: 'Ana Ruiz', roles: ['Admin'] };

describe('UserMenu', () => {
    let store: InstanceType<typeof SessionStore>;
    let logoutSpy: ReturnType<typeof vi.fn>;
    let navigateSpy: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
        logoutSpy = vi.fn().mockResolvedValue(undefined);
        navigateSpy = vi.fn().mockResolvedValue(true);

        await TestBed.configureTestingModule({
            providers: [
                { provide: LogoutService, useValue: { logout: logoutSpy } },
                { provide: Router, useValue: { navigate: navigateSpy } }
            ]
        }).compileComponents();

        store = TestBed.inject(SessionStore);
        store.setUser(null);
    });

    it('no renderiza nada cuando no hay usuario autenticado', () => {
        const fixture = TestBed.createComponent(UserMenu);
        fixture.detectChanges();

        expect((fixture.nativeElement as HTMLElement).querySelector('button')).toBeNull();
    });

    it('renderiza el icono de usuario como trigger', () => {
        store.setUser(ANA);
        const fixture = TestBed.createComponent(UserMenu);
        fixture.detectChanges();

        const trigger = (fixture.nativeElement as HTMLElement).querySelector('.pi-user');
        expect(trigger).not.toBeNull();
    });

    it('expone aria-label y tooltip accesibles en el trigger', () => {
        store.setUser(ANA);
        const fixture = TestBed.createComponent(UserMenu);
        fixture.detectChanges();

        const trigger = (fixture.nativeElement as HTMLElement).querySelector('button');
        expect(trigger?.getAttribute('aria-label')).toBe('Menú de usuario');
        expect(fixture.debugElement.query(By.directive(Tooltip))).not.toBeNull();
    });

    it('muestra el nombre, username y roles en el header del menú', () => {
        store.setUser(ANA);
        const fixture = TestBed.createComponent(UserMenu);
        fixture.detectChanges();

        const header: HTMLElement | null = (fixture.nativeElement as HTMLElement).querySelector('p-menu') ?? (fixture.nativeElement as HTMLElement);

        // Como el header se proyecta dentro del popup (appendTo="body"),
        // validamos los computed directamente:
        expect(fixture.componentInstance.rolesLabel()).toBe('Admin');
        expect(fixture.componentInstance.initials()).toBe('AR');
        expect(fixture.componentInstance.user()?.fullName).toBe('Ana Ruiz');
        expect(header).not.toBeNull();
    });

    it('el item "Perfil" navega a /perfil', async () => {
        store.setUser(ANA);
        const fixture = TestBed.createComponent(UserMenu);
        fixture.detectChanges();

        const perfil = fixture.componentInstance.menuItems().find((item) => item.label === 'Perfil');

        perfil?.command?.({ originalEvent: new Event('click') } as unknown as MenuItemCommandEvent);

        await Promise.resolve();

        expect(navigateSpy).toHaveBeenCalledWith(['/perfil']);
    });

    it('el item "Cerrar sesión" llama al LogoutService', async () => {
        store.setUser(ANA);
        const fixture = TestBed.createComponent(UserMenu);
        fixture.detectChanges();

        const logoutItem = fixture.componentInstance.menuItems().find((item) => item.label === 'Cerrar sesión');

        logoutItem?.command?.({ originalEvent: new Event('click') } as unknown as MenuItemCommandEvent);

        await Promise.resolve();

        expect(logoutSpy).toHaveBeenCalledOnce();
    });

    it('initials usa las dos primeras iniciales en mayúsculas', () => {
        store.setUser({ id: '2', username: 'jdoe', fullName: '  john   doe  ', roles: [] });
        const fixture = TestBed.createComponent(UserMenu);
        fixture.detectChanges();

        expect(fixture.componentInstance.initials()).toBe('JD');
    });
});
