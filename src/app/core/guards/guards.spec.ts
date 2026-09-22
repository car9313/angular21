import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter } from '@angular/router';
import { authGuard } from './auth.guard';
import { guestGuard } from './guest.guard';
import { permissionGuard } from './permission.guard';
import { SessionStore } from '../store/session.store';
import { ACTIONS } from '../constants/actions';

@Component({ selector: 'app-dummy', template: '' })
class DummyPage {}

describe('auth guards', () => {
    let store: InstanceType<typeof SessionStore>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideRouter([
                    { path: 'secure', component: DummyPage, canActivate: [authGuard, permissionGuard], data: { resource: 'users' } },
                    { path: 'open', component: DummyPage, canActivate: [guestGuard] },
                    { path: 'auth/login', component: DummyPage },
                    { path: 'auth/access', component: DummyPage }
                ])
            ]
        });
        store = TestBed.inject(SessionStore);
        store.reset();
    });

    it('authGuard lets a logged-in user through', () => {
        store.setUser({ id: '1', username: 'u', fullName: 'U', roles: [] });
        expect(TestBed.runInInjectionContext(() => authGuard({} as never, { url: '/secure' } as never))).toBe(true);
    });

    it('authGuard redirects to login with returnUrl when logged out', () => {
        const result = TestBed.runInInjectionContext(() => authGuard({} as never, { url: '/secure' } as never)) as unknown as URL;
        expect(result.toString()).toBe('/auth/login?returnUrl=%2Fsecure');
    });

    it('guestGuard keeps logged-in users away from guest pages', () => {
        store.setUser({ id: '1', username: 'u', fullName: 'U', roles: [] });
        const result = TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never)) as unknown as URL;
        expect(result.toString()).toBe('/');
    });

    it('permissionGuard denies a resource route without permissions (default Read required)', () => {
        store.setUser({ id: '1', username: 'u', fullName: 'U', roles: [] });
        store.setPermissions([]);
        const result = TestBed.runInInjectionContext(() => permissionGuard({ data: { resource: 'users' } } as never, {} as never)) as unknown as URL;
        expect(result.toString()).toBe('/auth/access');
    });

    it('permissionGuard allows when the required action is granted', () => {
        store.setUser({ id: '1', username: 'u', fullName: 'U', roles: ['Admin'] });
        store.setPermissions([{ resource: 'users', actions: [ACTIONS.Read] }]);
        expect(TestBed.runInInjectionContext(() => permissionGuard({ data: { resource: 'users' } } as never, {} as never))).toBe(true);
    });

    it('permissionGuard demands Read by default even when other actions are granted', () => {
        store.setUser({ id: '1', username: 'u', fullName: 'U', roles: ['Admin'] });
        store.setPermissions([{ resource: 'users', actions: [ACTIONS.Delete] }]);
        const result = TestBed.runInInjectionContext(() => permissionGuard({ data: { resource: 'users' } } as never, {} as never)) as unknown as URL;
        expect(result.toString()).toBe('/auth/access');
    });

    it('permissionGuard treats routes without resource as public', () => {
        expect(TestBed.runInInjectionContext(() => permissionGuard({ data: {} } as never, {} as never))).toBe(true);
    });

    it('permissionGuard treats a route declared resource:"Public" as public (magic string)', () => {
        // Even with no user at all, the explicit Public marker is universally allowed.
        expect(TestBed.runInInjectionContext(() => permissionGuard({ data: { resource: 'Public' } } as never, {} as never))).toBe(true);
    });
});
