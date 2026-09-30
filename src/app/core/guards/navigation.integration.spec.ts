import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideZonelessChangeDetection, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { appRoutes } from '../../app.routes';
import { SessionStore } from '../store/session.store';

@Component({
    selector: 'app-test-host',
    standalone: true,
    imports: [RouterModule],
    template: `<router-outlet></router-outlet>`
})
class TestHost {}

/**
 * Integration test with the REAL route tree rendered inside a real host
 * component (root outlet included). A hydrated session must land on
 * /panel-principal with the layout projected after the root outlet —
 * reproduces the runtime report where the URL changed but nothing rendered.
 */
describe('post-login navigation (real routes)', () => {
    let router: Router;
    let store: InstanceType<typeof SessionStore>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [TestHost],
            // MessageService backs the layout's global <p-toast> host.
            providers: [provideRouter(appRoutes), provideZonelessChangeDetection(), MessageService]
        });

        router = TestBed.inject(Router);
        store = TestBed.inject(SessionStore);

        // Fully hydrated session (what LoginUseCase does on a 200+200 login).
        store.setUser({ id: '1', username: 'admin', fullName: 'Administrador', roles: ['Administrador'] });
        store.setPermissions([
            { resource: 'panel', actions: ['Read'] },
            { resource: 'users', actions: ['Read'] }
        ]);
    });

    it('navigates to /panel-principal and projects the layout after the root outlet', async () => {
        const fixture = TestBed.createComponent(TestHost);
        fixture.detectChanges();

        const result = await router.navigateByUrl('/panel-principal');
        fixture.detectChanges();

        expect(result, 'navigation must succeed').toBe(true);
        expect(router.url).toBe('/panel-principal');

        const outlet = (fixture.nativeElement as HTMLElement).querySelector('router-outlet');
        const activated = outlet?.nextElementSibling;
        expect(activated, 'a component must be projected right after the root outlet').toBeTruthy();
    });

    it('redirects to /auth/access when permissionGuard denies a route resource', async () => {
        // The hydrated session above grants panel/users but NOT 'Role',
        // so the real /seguridad/roles route (resource: 'Role') must be
        // refused by permissionGuard wired on the parent layout route.
        const fixture = TestBed.createComponent(TestHost);
        fixture.detectChanges();

        const result = await router.navigateByUrl('/seguridad/roles');
        fixture.detectChanges();

        // Guard redirects resolve the navigation chain toward the redirect
        // target, so the contract under test is the final URL.
        expect(result, 'the redirect chain must complete').toBe(true);
        expect(router.url).toBe('/auth/access');
    });
});
