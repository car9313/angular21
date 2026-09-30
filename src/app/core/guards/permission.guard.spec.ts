import { describe, it, expect, beforeEach } from 'vitest';
import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, Routes, RouterModule } from '@angular/router';
import { permissionGuard } from './permission.guard';
import { SessionStore } from '../store/session.store';
import { RESOURCES } from '../constants/resources';
import { ACTIONS } from '../constants/actions';

@Component({
    selector: 'app-dummy',
    standalone: true,
    template: 'ok'
})
class Dummy {}

@Component({
    selector: 'app-test-host',
    standalone: true,
    imports: [RouterModule],
    template: `<router-outlet></router-outlet>`
})
class TestHost {}

const routes: Routes = [
    {
        path: '',
        canActivateChild: [permissionGuard],
        children: [
            { path: 'public', component: Dummy },
            { path: 'magic', component: Dummy, data: { resource: 'Public' } },
            { path: 'granted', component: Dummy, data: { resource: RESOURCES.Roles, actions: [ACTIONS.Read] } },
            { path: 'denied', component: Dummy, data: { resource: RESOURCES.Roles, actions: [ACTIONS.Create] } },
            { path: 'default-read', component: Dummy, data: { resource: RESOURCES.Roles } },
            { path: 'unknown-resource', component: Dummy, data: { resource: 'DoesNotExist', actions: [ACTIONS.Read] } }
        ]
    },
    // Redirect target of permissionGuard — must exist in this test route tree.
    { path: 'auth/access', component: Dummy }
];

/**
 * Contract coverage for permissionGuard (route data gate):
 * - no resource / magic 'Public' → always allowed
 * - granted vs missing action → pass / redirect to /auth/access
 * - resource without actions → requires Read by default
 * - never granted 'unknown-resource' → denied
 */
describe('permissionGuard', () => {
    let router: Router;
    let store: InstanceType<typeof SessionStore>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [TestHost],
            providers: [provideRouter(routes), provideZonelessChangeDetection()]
        });

        router = TestBed.inject(Router);
        store = TestBed.inject(SessionStore);
        // hasPermission requires an authenticated user (store contract), so
        // both the identity and the permissions must be set.
        store.setUser({ id: '1', username: 'tester', fullName: 'Tester', roles: ['Admin'] });
        store.setPermissions([{ resource: RESOURCES.Roles, actions: [ACTIONS.Read] }]);
    });

    it('allows routes declared without resource (public by default)', async () => {
        TestBed.createComponent(TestHost);

        const result = await router.navigateByUrl('/public');

        expect(result).toBe(true);
        expect(router.url).toBe('/public');
    });

    it("allows the magic 'Public' resource explicitly", async () => {
        TestBed.createComponent(TestHost);

        const result = await router.navigateByUrl('/magic');

        expect(result).toBe(true);
        expect(router.url).toBe('/magic');
    });

    it('allows navigation when the session grants the required action', async () => {
        TestBed.createComponent(TestHost);

        const result = await router.navigateByUrl('/granted');

        expect(result).toBe(true);
        expect(router.url).toBe('/granted');
    });

    it('redirects to /auth/access when the action is not granted', async () => {
        TestBed.createComponent(TestHost);

        await router.navigateByUrl('/denied');

        // Guard redirects resolve the chain toward the target, so the contract
        // under test is the final URL (Angular does not report "refused").
        expect(router.url).toBe('/auth/access');
    });

    it('requires Read by default when no actions are declared', async () => {
        TestBed.createComponent(TestHost);

        const result = await router.navigateByUrl('/default-read');

        expect(result).toBe(true);
        expect(router.url).toBe('/default-read');
    });

    it('denies a resource the session never granted', async () => {
        TestBed.createComponent(TestHost);

        await router.navigateByUrl('/unknown-resource');

        expect(router.url).toBe('/auth/access');
    });
});
