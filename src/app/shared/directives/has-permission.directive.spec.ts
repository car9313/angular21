import { describe, it, expect, beforeEach } from 'vitest';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HasPermissionDirective } from './has-permission.directive';
import { SessionStore } from '@/app/core/store/session.store';

/** Aislamiento puro de la microsyntax del gate (mismo patrón que ToolbarComponent). */
@Component({
    standalone: true,
    imports: [HasPermissionDirective],
    template: `
        <span
            *appHasPermission="let ok; resource: resource(); actions: actions()"
            data-testid="gated"
        >gated</span>
    `
})
class MicrosyntaxHost {
    readonly resource = signal('Role');
    readonly actions = signal(['Crear']);
}

describe('HasPermissionDirective', () => {
    let store: InstanceType<typeof SessionStore>;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        store = TestBed.inject(SessionStore);
        store.reset();
    });

    it('renderiza con microsyntax cuando hay permiso', () => {
        store.setUser({ id: '1', username: 'admin', fullName: 'Admin', roles: ['Administrador'] });
        store.setPermissions([{ resource: 'Role', actions: ['Crear'] }]);

        const fixture = TestBed.createComponent(MicrosyntaxHost);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('[data-testid="gated"]')).not.toBeNull();
    });

    it('no renderiza con microsyntax cuando falta el permiso', () => {
        store.setUser({ id: '1', username: 'admin', fullName: 'Admin', roles: ['Administrador'] });
        store.setPermissions([{ resource: 'Role', actions: ['Leer'] }]);

        const fixture = TestBed.createComponent(MicrosyntaxHost);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('[data-testid="gated"]')).toBeNull();
    });
});
