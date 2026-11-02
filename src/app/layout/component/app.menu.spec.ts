import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { MenuItem } from 'primeng/api';

import { AppMenu } from './app.menu';
import { MenuPermissionService } from '@/app/core/services/menu-permission.service';
import { MENU_ITEMS } from '@/app/core/constants/menu';

const ALLOWED: MenuItem[] = [
    { label: 'Nomencladores', items: [{ label: 'Países', routerLink: ['/paises'] }] },
    { label: 'Seguridad', items: [{ label: 'Usuarios', routerLink: ['/usuarios'] }] },
    { separator: true }
];

function permissionStub() {
    return { filterByPermission: vi.fn(() => ALLOWED) };
}

describe('AppMenu', () => {
    let fixture: ComponentFixture<AppMenu>;
    let permission: ReturnType<typeof permissionStub>;

    beforeEach(() => {
        permission = permissionStub();
        localStorage.clear();
        sessionStorage.clear();

        TestBed.configureTestingModule({
            imports: [AppMenu],
            providers: [provideZonelessChangeDetection(), provideRouter([]), { provide: MenuPermissionService, useValue: permission }]
        });

        fixture = TestBed.createComponent(AppMenu);
        fixture.detectChanges();
    });

    it('filters the declared menu through the permission service', () => {
        expect(permission.filterByPermission).toHaveBeenCalledWith(MENU_ITEMS);
    });

    it('renders one menu item per allowed entry and keeps separators', () => {
        const host = fixture.nativeElement as HTMLElement;

        expect(host.querySelectorAll('ul.layout-menu > li[app-menuitem]').length).toBe(2);
        expect(host.querySelectorAll('ul.layout-menu > li.menu-separator').length).toBe(1);
        expect(host.textContent).toContain('Países');
        expect(host.textContent).toContain('Usuarios');
    });

    it('renders nothing when every item is denied', () => {
        permission.filterByPermission.mockReturnValue([]);
        fixture = TestBed.createComponent(AppMenu);
        fixture.detectChanges();

        expect((fixture.nativeElement as HTMLElement).querySelectorAll('ul.layout-menu > li[app-menuitem]').length).toBe(0);
    });
});
