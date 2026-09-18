import { describe, it, expect, beforeEach } from 'vitest';
import { SessionStore, SessionUser, Permission } from './session.store';

const user: SessionUser = {
    id: '1',
    username: 'juan',
    fullName: 'Juan Pérez',
    roles: ['Admin']
};

const permissions: Permission[] = [
    { resource: 'users', actions: ['Read', 'Create'] },
    { resource: 'roles', actions: ['Read', 'Update'] }
];

describe('SessionStore', () => {
    let store: InstanceType<typeof SessionStore>;

    beforeEach(() => {
        store = new SessionStore();
    });

    it('starts logged out with empty permissions', () => {
        expect(store.user()).toBeNull();
        expect(store.permissions()).toEqual([]);
        expect(store.isAuthenticated()).toBe(false);
        expect(store.configLoaded()).toBe(false);
    });

    it('authenticates the user', () => {
        store.setUser(user);
        store.markConfigLoaded();

        expect(store.user()).toEqual(user);
        expect(store.isAuthenticated()).toBe(true);
        expect(store.configLoaded()).toBe(true);
    });

    it('grants any permission on a resource when actions are omitted', () => {
        store.setUser(user);
        store.setPermissions(permissions);

        expect(store.hasPermission('users')).toBe(true);
    });

    it('grants only when every requested action is present', () => {
        store.setUser(user);
        store.setPermissions(permissions);

        expect(store.hasPermission('users', ['Read'])).toBe(true);
        expect(store.hasPermission('users', ['Read', 'Create'])).toBe(true);
        expect(store.hasPermission('users', ['Delete'])).toBe(false);
        expect(store.hasPermission('users', ['Read', 'Delete'])).toBe(false);
    });

    it('denies unknown resources and unauthenticated access', () => {
        store.setUser(user);
        store.setPermissions(permissions);
        expect(store.hasPermission('audits', ['Read'])).toBe(false);

        store.setUser(null);
        expect(store.hasPermission('users', ['Read'])).toBe(false);
        expect(store.hasPermission('users')).toBe(false);
    });

    it('reset() clears identity and permissions (logout)', () => {
        store.setUser(user);
        store.setPermissions(permissions);
        store.markConfigLoaded();

        store.reset();

        expect(store.user()).toBeNull();
        expect(store.permissions()).toEqual([]);
        expect(store.isAuthenticated()).toBe(false);
        expect(store.configLoaded()).toBe(true);
    });
});