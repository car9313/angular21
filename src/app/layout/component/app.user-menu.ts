import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { SessionStore } from '../../core/store/session.store';
import { LogoutService } from '../../core/services/logout.service';

/** Derives up-to-two-letter initials from a full name. */
function initialsOf(fullName: string): string {
    return fullName
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');
}

/**
 * Topbar user menu: identity summary (owned by SessionStore) and logout.
 * The popup panel content is portaled by PrimeNG outside the component, so
 * the header uses inline styles (scoped styles would not reach the overlay).
 */
@Component({
    selector: 'app-user-menu',
    standalone: true,
    imports: [MenuModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    styles: [
        `
            .user-menu-avatar {
                width: 2rem;
                height: 2rem;
                border-radius: 50%;
                background: var(--primary-color);
                color: var(--primary-contrast-color, #fff);
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 0.75rem;
                font-weight: 600;
            }
        `
    ],
    template: `
        @if (user(); as current) {
            <div class="relative">
                <button type="button" class="layout-topbar-action layout-topbar-action-highlight" (click)="menu.toggle($event)" aria-label="User menu">
                    <span class="user-menu-avatar">{{ initials() }}</span>
                </button>
                <p-menu #menu [popup]="true" [model]="menuItems()">
                    <ng-template #start>
                        <div style="display: flex; flex-direction: column; gap: 0.25rem; padding: 0.75rem 1rem; min-width: 12rem;">
                            <span style="font-weight: 600;">{{ current.fullName }}</span>
                            <span style="font-size: 0.875rem; opacity: 0.7;">&#64;{{ current.username }}</span>
                            @if (rolesLabel()) {
                                <span style="font-size: 0.75rem; opacity: 0.6;">{{ rolesLabel() }}</span>
                            }
                        </div>
                    </ng-template>
                </p-menu>
            </div>
        }
    `
})
export class UserMenu {
    private readonly session = inject(SessionStore);
    private readonly logoutService = inject(LogoutService);

    readonly user = this.session.user;

    readonly initials = computed(() => {
        const fullName = this.session.user()?.fullName;
        return fullName ? initialsOf(fullName) : '';
    });

    readonly rolesLabel = computed(() => this.session.user()?.roles.join(', ') ?? '');

    readonly menuItems = computed<MenuItem[]>(() => [
        {
            label: 'Log out',
            icon: 'pi pi-sign-out',
            command: () => void this.logoutService.logout()
        }
    ]);
}
