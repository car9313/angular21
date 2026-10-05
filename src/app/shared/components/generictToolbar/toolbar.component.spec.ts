import { describe, it, expect, beforeEach } from 'vitest';
import { Component, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ToolbarComponent, ToolbarConfig } from './toolbar.component';
import { SessionStore } from '@/app/core/store/session.store';
import { RESOURCES } from '@/app/core/constants/resources';
import { ACTIONS } from '@/app/core/constants/actions';

/** Espejo del uso sin `addLabel`: variante icon-only heredada. */
@Component({
    standalone: true,
    imports: [ToolbarComponent],
    template: `
        <app-toolbar
            [resource]="resource"
            [actions]="actions"
            [config]="config"
            (created)="created = true"
        ></app-toolbar>
    `
})
class HostComponent {
    readonly resource = RESOURCES.Roles;
    readonly actions = [ACTIONS.Create];
    readonly config: ToolbarConfig = { visible: true };
    created = false;
}

/** Espejo exacto de como RolesPage usa el toolbar (con `addLabel`). */
@Component({
    // Selector explícito: evita la colisión de Component ID (NG0912) con
    // HostComponent, que comparte archivo y no declara selector.
    selector: 'app-host-labeled',
    standalone: true,
    imports: [ToolbarComponent],
    template: `
        <app-toolbar
            [resource]="resource"
            [actions]="actions"
            [config]="config"
            (created)="created = true"
        ></app-toolbar>
    `
})
class HostLabeledComponent {
    readonly resource = RESOURCES.Roles;
    readonly actions = [ACTIONS.Create];
    readonly config: ToolbarConfig = { visible: true, addLabel: 'Nuevo Rol' };
    created = false;
}

describe('ToolbarComponent — botón de alta', () => {
    let store: InstanceType<typeof SessionStore>;

    /** Simula lo que deja IdentityHydrator tras /api/auth/user/current. */
    const grantRolePermissions = (actions: string[]): void => {
        store.setUser({ id: '1', username: 'admin', fullName: 'Administrador', roles: ['Administrador'] });
        store.setPermissions([{ resource: RESOURCES.Roles, actions }]);
    };

    /**
     * One plain CD pass — the same `tick()` the app runs. The gate drives its
     * view from an `effect()`, so this also proves the effect flushes inside a
     * normal cycle rather than needing a manual nudge.
     *
     * `ariaLabel` (input) lands on PrimeNG's inner `<button>`, so the query
     * targets any element carrying the accessible name.
     */
    const addAndDetectChanges = (host: Type<object> = HostComponent): HTMLElement => {
        const fixture = TestBed.createComponent(host);
        fixture.detectChanges();
        return fixture.nativeElement as HTMLElement;
    };

    const queryAddButton = (root: HTMLElement): Element | null => root.querySelector('[aria-label="Agregar nuevo"]');

    beforeEach(() => {
        TestBed.configureTestingModule({});
        store = TestBed.inject(SessionStore);
        store.reset();
    });

    it('muestra el botón de alta cuando la sesión tiene Role/Crear', () => {
        grantRolePermissions(['Leer', 'Crear', 'Actualizar', 'Eliminar']);

        const root = addAndDetectChanges();

        const addButton = queryAddButton(root);
        expect(addButton).not.toBeNull();
    });

    it('oculta el botón de alta cuando la sesión no tiene Role/Crear', () => {
        grantRolePermissions(['Leer']);

        const root = addAndDetectChanges();

        const addButton = queryAddButton(root);
        expect(addButton).toBeNull();
    });

    it('oculta el botón de alta sin sesión autenticada', () => {
        store.reset();

        const root = addAndDetectChanges();

        const addButton = queryAddButton(root);
        expect(addButton).toBeNull();
    });

    it('renderiza el botón etiquetado "Nuevo Rol" con nombre accesible cuando hay permiso', () => {
        grantRolePermissions(['Leer', 'Crear', 'Actualizar', 'Eliminar']);

        const root = addAndDetectChanges(HostLabeledComponent);

        const button = root.querySelector('[aria-label="Nuevo Rol"]');
        expect(button).not.toBeNull();
        expect(button?.textContent).toContain('Nuevo Rol');
    });

    it('oculta el botón etiquetado cuando la sesión no tiene Role/Crear', () => {
        grantRolePermissions(['Leer']);

        const root = addAndDetectChanges(HostLabeledComponent);

        expect(root.querySelector('[aria-label="Nuevo Rol"]')).toBeNull();
    });
});
