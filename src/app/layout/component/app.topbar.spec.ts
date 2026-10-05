import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { Tooltip } from 'primeng/tooltip';
import { SessionStore } from '@/app/core/store/session.store';
import { AppTopbar } from './app.topbar';

type TopbarDebug = ComponentFixture<AppTopbar>['debugElement'];

function expectLabeledButton(fixture: TopbarDebug, label: string, selector: string): void {
    const el = fixture.query(By.css(selector));
    expect(el, `missing topbar button: ${label}`).not.toBeNull();
    expect(el?.injector.get(Tooltip, null), `missing tooltip: ${label}`).not.toBeNull();
}

describe('AppTopbar', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [provideRouter([])] });
        TestBed.inject(SessionStore).setUser({ id: '1', username: 'aruiz', fullName: 'Ana Ruiz', roles: ['Admin'] });
    });

    it('gives every topbar button an accessible name and a tooltip', () => {
        const fixture = TestBed.createComponent(AppTopbar);
        fixture.detectChanges();

        expectLabeledButton(fixture.debugElement, 'Alternar menú lateral', '.layout-menu-button[aria-label="Alternar menú lateral"]');
        expectLabeledButton(fixture.debugElement, 'Personalizar apariencia', '[aria-label="Personalizar apariencia"]');
        expectLabeledButton(fixture.debugElement, 'Menú de usuario', '[aria-label="Menú de usuario"]');

        const darkLabel = (fixture.nativeElement as HTMLElement).querySelector('.layout-config-menu > button')?.getAttribute('aria-label');
        expect(['Activar modo oscuro', 'Activar modo claro']).toContain(darkLabel);
        expectLabeledButton(
            fixture.debugElement,
            'toggle de modo oscuro',
            `.layout-config-menu > button[aria-label="${darkLabel}"]`
        );
    });
});
