import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MenuPermissionService } from './menu-permission.service';
import { SessionStore } from '../store/session.store';
import { SecuredMenuItem } from '../constants/menu';
import { ACTIONS } from '../constants/actions';

describe('MenuPermissionService', () => {
    let service: MenuPermissionService;
    let store: InstanceType<typeof SessionStore>;

    const tree: SecuredMenuItem[] = [
        {
            label: 'Inicio',
            items: [{ label: 'Panel', routerLink: ['/panel'], resource: 'panel' }]
        },
        {
            label: 'Administración',
            items: [
                {
                    label: 'Seguridad',
                    items: [
                        { label: 'Usuarios', routerLink: ['/usuarios'], resource: 'users', requiredActions: [ACTIONS.Read] },
                        { label: 'Ayuda', routerLink: ['/ayuda'], alwaysVisible: true }
                    ]
                }
            ]
        }
    ];

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(MenuPermissionService);
        store = TestBed.inject(SessionStore);
        store.setUser(null);
    });

    it('shows only non-resource items when logged out and drops empty groups', () => {
        const filtered = service.filterByPermission(tree);

        // 'Inicio' collapses (its only leaf requires a permission); the
        // visible branch is Administración → Seguridad → Ayuda.
        expect(filtered).toHaveLength(1);
        expect(filtered[0].label).toBe('Administración');
        expect(JSON.stringify(filtered)).not.toContain('Panel');
        expect(JSON.stringify(filtered)).toContain('Ayuda');
    });

    it('shows leaves once the user has the required permission', () => {
        store.setUser({ id: '1', username: 'admin', fullName: 'Admin', roles: ['Admin'] });
        store.setPermissions([{ resource: 'users', actions: [ACTIONS.Read] }]);

        const filtered = service.filterByPermission(tree);

        expect(JSON.stringify(filtered)).toContain('Usuarios');
        expect(JSON.stringify(filtered)).not.toContain('/panel');
    });

    it('hides a leaf when only a different action is granted', () => {
        store.setUser({ id: '1', username: 'admin', fullName: 'Admin', roles: ['Admin'] });
        store.setPermissions([{ resource: 'users', actions: [ACTIONS.Create] }]);

        const filtered = JSON.stringify(service.filterByPermission(tree));

        expect(filtered).not.toContain('Usuarios');
    });

    it('always keeps alwaysVisible entries regardless of permissions', () => {
        store.setUser(null);
        const filtered = JSON.stringify(service.filterByPermission(tree));

        expect(filtered).toContain('Ayuda');
    });

    it('is reactive: the same tree yields different results after login', () => {
        const before = JSON.stringify(service.filterByPermission(tree));
        store.setUser({ id: '1', username: 'admin', fullName: 'Admin', roles: ['Admin'] });
        store.setPermissions([{ resource: 'users', actions: [ACTIONS.Read] }]);
        const after = JSON.stringify(service.filterByPermission(tree));

        expect(before).not.toEqual(after);
    });
});