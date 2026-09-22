import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { SessionStore } from '../core/store/session.store';

/**
 * Post-login home (devueltos' panel-principal equivalent).
 * Minimal on purpose: proves the authenticated session end-to-end (store
 * hydration, RBAC menu, breadcrumb/title wiring) without porting the
 * reference dashboard's chart debt. Grows with Fase 5.
 */
@Component({
    selector: 'app-panel-principal',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="border-round-xl surface-card p-6">
            <div class="text-2xl font-medium mb-2">Hola, {{ user()?.fullName ?? 'invitado' }}</div>
            <div class="text-muted-color mb-3">&#64;{{ user()?.username ?? 'sesión anónima' }}</div>
            @if (roles(); as roles) {
                @if (roles.length) {
                    <div class="flex gap-2">
                        @for (role of roles; track role) {
                            <span class="inline-flex align-items-center justify-content-center bg-primary text-primary-contrast border-round px-2 py-1 text-sm">{{ role }}</span>
                        }
                    </div>
                }
            }
            <div class="text-muted-color mt-3">Sesión iniciada correctamente. El módulo de seguridad llega en la Fase 2.5.</div>
        </div>
    `
})
export class PanelPrincipal {
    private readonly session = inject(SessionStore);

    readonly user = this.session.user;

    readonly roles = computed(() => this.session.user()?.roles ?? []);
}