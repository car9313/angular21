import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { MenuItem } from 'primeng/api';

import { AppMenuitem } from './app.menuitem';
import { LayoutService } from '@/app/layout/service/layout.service';

function group(overrides: Partial<MenuItem> = {}): MenuItem {
    return { label: 'Nomencladores', icon: 'pi pi-fw pi-map', items: [{ label: 'Países', routerLink: ['/paises'] }], ...overrides };
}

describe('AppMenuitem', () => {
    let fixture: ComponentFixture<AppMenuitem>;
    let component: AppMenuitem;
    let layout: LayoutService;

    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();

        TestBed.configureTestingModule({
            imports: [AppMenuitem],
            providers: [provideZonelessChangeDetection(), provideRouter([{ path: '', children: [] }])]
        });

        layout = TestBed.inject(LayoutService);
        fixture = TestBed.createComponent(AppMenuitem);
        component = fixture.componentInstance;
    });

    function render(item: MenuItem, parentKey = ''): HTMLElement {
        fixture.componentRef.setInput('item', item);
        fixture.componentRef.setInput('parentKey', parentKey);
        fixture.detectChanges();
        return fixture.nativeElement as HTMLElement;
    }

    function anchor(): HTMLAnchorElement {
        return (fixture.nativeElement as HTMLElement).querySelector('a') as HTMLAnchorElement;
    }

    it('renders the toggler collapsed by default', () => {
        const host = render(group());

        expect(host.querySelector('.layout-submenu-toggler')).toBeTruthy();
        expect(anchor().classList.contains('submenu-expanded')).toBe(false);
        expect(anchor().getAttribute('aria-expanded')).toBe('false');
    });

    it('expands on click and rotates the toggler through the expanded class', () => {
        render(group());

        anchor().click();
        fixture.detectChanges();

        expect(layout.layoutState().expandedGroups).toEqual(['Nomencladores']);
        expect(anchor().classList.contains('submenu-expanded')).toBe(true);
        expect(anchor().getAttribute('aria-expanded')).toBe('true');
        expect(component.isExpanded()).toBe(true);
    });

    it('collapses again on a second click', () => {
        render(group());

        anchor().click();
        fixture.detectChanges();
        anchor().click();
        fixture.detectChanges();

        expect(layout.layoutState().expandedGroups).toEqual([]);
        expect(anchor().classList.contains('submenu-expanded')).toBe(false);
        expect(anchor().getAttribute('aria-expanded')).toBe('false');
    });

    it('builds a stable nested group key from the parent chain', () => {
        render(group(), 'Seguridad');

        anchor().click();
        fixture.detectChanges();

        expect(layout.layoutState().expandedGroups).toEqual(['Seguridad/Nomencladores']);
    });

    it('keeps groups independent from each other', () => {
        const secondFixture = TestBed.createComponent(AppMenuitem);
        secondFixture.componentRef.setInput('item', group({ label: 'Seguridad' }));
        secondFixture.detectChanges();

        render(group());
        anchor().click();
        secondFixture.detectChanges();

        expect(layout.layoutState().expandedGroups).toEqual(['Nomencladores']);
        expect((secondFixture.nativeElement as HTMLElement).querySelector('a')?.classList.contains('submenu-expanded')).toBe(false);
    });

    it('does not toggle groups for leaf links', () => {
        render({ label: 'Países', routerLink: ['/'] });

        anchor().click();
        fixture.detectChanges();

        expect(layout.layoutState().expandedGroups).toEqual([]);
        expect(anchor().querySelector('.layout-submenu-toggler')).toBeNull();
    });

    it('ignores clicks on disabled items', () => {
        render(group({ disabled: true }));

        anchor().click();
        fixture.detectChanges();

        expect(layout.layoutState().expandedGroups).toEqual([]);
    });

    it('renders nothing when the item is explicitly hidden', () => {
        const host = render(group({ visible: false }));

        expect(host.querySelector('a')).toBeNull();
        expect(host.querySelector('.layout-submenu-toggler')).toBeNull();
    });

    it('shows the root header and keeps root groups always expanded', () => {
        fixture.componentRef.setInput('root', true);
        fixture.componentRef.setInput('item', group());
        fixture.detectChanges();

        expect((fixture.nativeElement as HTMLElement).querySelector('.layout-menuitem-root-text')?.textContent).toContain('Nomencladores');
        expect(component.isExpanded()).toBe(true);
    });
});
