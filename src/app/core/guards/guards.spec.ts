import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter } from '@angular/router';
import { authGuard } from './auth.guard';
import { guestGuard } from './guest.guard';
import { permissionGuard } from './permission.guard';
import { SessionReadyService } from './session-ready.service';
import { RestoreSessionUseCase } from '../../modules/auth/application/restore-session.use-case';
import { SessionStore } from '../store/session.store';
import { ACTIONS } from '../constants/actions';

@Component({ selector: 'app-dummy', template: '' })
class DummyPage {}

describe('auth guards', () => {
    let store: InstanceType<typeof SessionStore>;
    let sessionReady: SessionReadyService;
    let restoreSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        restoreSpy = vi.fn().mockResolvedValue(undefined);

        TestBed.configureTestingModule({
            providers: [
                provideRouter([
                    { path: 'secure', component: DummyPage, canActivate: [authGuard, permissionGuard], data: { resource: 'users' } },
                    { path: 'open', component: DummyPage, canActivate: [guestGuard] },
                    { path: 'auth/login', component: DummyPage },
                    { path: 'auth/access', component: DummyPage }
                ]),
                { provide: RestoreSessionUseCase, useValue: { execute: restoreSpy } }
            ]
        });
        store = TestBed.inject(SessionStore);
        sessionReady = TestBed.inject(SessionReadyService);
        store.reset();
        sessionReady.reset();
    });

    it('authGuard lets a logged-in user through', async () => {
        store.setUser({ id: '1', username: 'u', fullName: 'U', roles: [] });
        expect(await TestBed.runInInjectionContext(() => authGuard({} as never, { url: '/secure' } as never))).toBe(true);
        expect(restoreSpy).toHaveBeenCalledTimes(1);
    });

    it('authGuard redirects to login with returnUrl when logged out', async () => {
        const result = (await TestBed.runInInjectionContext(() => authGuard({} as never, { url: '/secure' } as never))) as unknown as URL;
        expect(result.toString()).toBe('/auth/login?returnUrl=%2Fsecure');
    });

    it('authGuard waits for session restoration before deciding (F5 race)', async () => {
        let resolveRestore: (() => void) | undefined;
        restoreSpy.mockImplementation(() => new Promise<void>((r) => (resolveRestore = r)));

        const decision = TestBed.runInInjectionContext(() => authGuard({} as never, { url: '/secure' } as never)) as Promise<boolean | URL>;

        // While the restore is pending, no redirect must have happened yet.
        let settled = false;
        void decision.then(() => (settled = true));
        await Promise.resolve();
        expect(settled).toBe(false);

        // Hydrate mid-flight, then let the restore resolve.
        store.setUser({ id: '1', username: 'u', fullName: 'U', roles: [] });
        resolveRestore!();

        expect(await decision).toBe(true);
    });

    it('guestGuard keeps logged-in users away from guest pages', async () => {
        store.setUser({ id: '1', username: 'u', fullName: 'U', roles: [] });
        const result = (await TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never))) as unknown as URL;
        expect(result.toString()).toBe('/');
    });

    it('guestGuard lets anonymous users into guest pages', async () => {
        expect(await TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never))).toBe(true);
    });

    it('permissionGuard denies a resource route without permissions (default Read required)', async () => {
        store.setUser({ id: '1', username: 'u', fullName: 'U', roles: [] });
        store.setPermissions([]);
        const result = (await TestBed.runInInjectionContext(() => permissionGuard({ data: { resource: 'users' } } as never, {} as never))) as unknown as URL;
        expect(result.toString()).toBe('/auth/access');
    });

    it('permissionGuard allows when the required action is granted', async () => {
        store.setUser({ id: '1', username: 'u', fullName: 'U', roles: ['Admin'] });
        store.setPermissions([{ resource: 'users', actions: [ACTIONS.Read] }]);
        expect(await TestBed.runInInjectionContext(() => permissionGuard({ data: { resource: 'users' } } as never, {} as never))).toBe(true);
    });

    it('permissionGuard demands Read by default even when other actions are granted', async () => {
        store.setUser({ id: '1', username: 'u', fullName: 'U', roles: ['Admin'] });
        store.setPermissions([{ resource: 'users', actions: [ACTIONS.Delete] }]);
        const result = (await TestBed.runInInjectionContext(() => permissionGuard({ data: { resource: 'users' } } as never, {} as never))) as unknown as URL;
        expect(result.toString()).toBe('/auth/access');
    });

    it('permissionGuard treats routes without resource as public', async () => {
        expect(await TestBed.runInInjectionContext(() => permissionGuard({ data: {} } as never, {} as never))).toBe(true);
    });

    it('permissionGuard treats a route declared resource:"Public" as public (magic string)', async () => {
        // Even with no user at all, the explicit Public marker is universally allowed.
        expect(await TestBed.runInInjectionContext(() => permissionGuard({ data: { resource: 'Public' } } as never, {} as never))).toBe(true);
    });
});
