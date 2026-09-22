import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { SessionStore } from '../core/store/session.store';
import { PanelPrincipal } from './panel-principal';

describe('PanelPrincipal', () => {
    let store: InstanceType<typeof SessionStore>;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        store = TestBed.inject(SessionStore);
        store.reset();
    });

    it('greets the authenticated user by name and username', () => {
        store.setUser({ id: '1', username: 'aruiz', fullName: 'Ana Ruiz', roles: ['Admin'] });
        const fixture = TestBed.createComponent(PanelPrincipal);
        fixture.detectChanges();

        const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
        expect(text).toContain('Hola, Ana Ruiz');
        expect(text).toContain('@aruiz');
    });

    it('renders the role chips for the session roles', () => {
        store.setUser({ id: '1', username: 'aruiz', fullName: 'Ana Ruiz', roles: ['Admin', 'Auditor'] });
        const fixture = TestBed.createComponent(PanelPrincipal);
        fixture.detectChanges();

        const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
        expect(text).toContain('Admin');
        expect(text).toContain('Auditor');
    });

    it('falls back to the guest copy when there is no session', () => {
        const fixture = TestBed.createComponent(PanelPrincipal);
        fixture.detectChanges();

        const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
        expect(text).toContain('Hola, invitado');
    });
});