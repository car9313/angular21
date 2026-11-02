// src/app/layout/app.user-menu.ts
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Menu } from 'primeng/menu';
import { Tooltip } from 'primeng/tooltip';
import { SessionStore } from '@/app/core/store/session.store';
import { LogoutService } from '@/app/core/services/logout.service';
import { Router } from '@angular/router';

function initialsOf(fullName: string): string {
    return fullName
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');
}

@Component({
    selector: 'app-user-menu',
    standalone: true,
    imports: [Menu, Tooltip],
    changeDetection: ChangeDetectionStrategy.OnPush,
    styles: [
        `
            .user-menu-avatar {
                width: 2rem;
                height: 2rem;
                border-radius: 50%;
                /* White chip on the primary bar — an emerald-on-emerald circle
                   is invisible (1:1). Initials go brand-dark (color-mix keeps
                   them tied to CORPORATE_PRIMARY) for ~5.4:1 on white. */
                background: var(--topbar-chip, #ffffff);
                color: var(--topbar-chip-content, color-mix(in srgb, var(--primary-color) 60%, #000));
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
                <button type="button" class="layout-topbar-action" (click)="menu.toggle($event)" aria-label="Menú de usuario" pTooltip="Menú de usuario" tooltipPosition="bottom" appendTo="body">
                    <!--   <span class="user-menu-avatar">{{ initials() }}</span>-->
                    <i class="pi pi-user"></i>
                </button>

                <p-menu #menu [popup]="true" [model]="menuItems()" appendTo="body">
                    <ng-template #start>
                        <div style="display:flex; flex-direction:column; gap:.25rem; padding:.75rem 1rem; min-width:12rem;">
                            <span style="font-weight:600;">{{ current.fullName }}</span>
                            <span style="font-size:.875rem; opacity:.7;">&#64;{{ current.username }}</span>
                            @if (rolesLabel()) {
                                <span style="font-size:.75rem; opacity:.6;">{{ rolesLabel() }}</span>
                            }
                        </div>
                    </ng-template>
                </p-menu>
            </div>
        }
    `
})
export class UserMenu {
    private readonly router: Router = inject(Router);
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
            label: 'Perfil',
            icon: 'pi pi-user',
            command: () => {
                this.router
                    .navigate(['/perfil'])
                    .then()
                    .catch(() => undefined);
            }
        },
        {
            label: 'Cerrar sesión',
            icon: 'pi pi-sign-out',
            command: () => void this.logoutService.logout()
        }
    ]);
}
