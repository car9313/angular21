import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { Tooltip } from 'primeng/tooltip';
import { AppConfigurator } from './app.configurator';
import { UserMenu } from './app.user-menu';
import { LayoutService } from '@/app/layout/service/layout.service';
import { PageTitleService } from '@/app/core/services/page-title.service';
import { Logo } from '@/app/shared/components/logo/logo';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [RouterModule, CommonModule, StyleClassModule, Tooltip, AppConfigurator, UserMenu, Logo],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
        <div class="layout-topbar">
            <div class="layout-topbar-logo-container">
                <button type="button" class="layout-menu-button layout-topbar-action" (click)="layoutService.onMenuToggle()" aria-label="Alternar menú lateral" pTooltip="Alternar menú lateral" tooltipPosition="bottom" appendTo="body">
                    <i class="pi pi-bars"></i>
                </button>
                <a class="layout-topbar-logo" routerLink="/">
                    <app-logo/>
                </a>
                @if (pageTitle.title()) {
                    <span class="layout-topbar-title" pTooltip="{{ pageTitle.title() }}">{{ pageTitle.title() }}</span>
                }
            </div>

            <div class="layout-topbar-actions">
                <div class="layout-config-menu">
                    <button
                        type="button"
                        class="layout-topbar-action"
                        (click)="toggleDarkMode()"
                        [attr.aria-label]="layoutService.isDarkTheme() ? 'Activar modo claro' : 'Activar modo oscuro'"
                        [pTooltip]="layoutService.isDarkTheme() ? 'Activar modo claro' : 'Activar modo oscuro'"
                        tooltipPosition="bottom"
                        appendTo="body"
                    >
                        <i [ngClass]="{ 'pi ': true, 'pi-moon': layoutService.isDarkTheme(), 'pi-sun': !layoutService.isDarkTheme() }"></i>
                    </button>
                    <div class="relative">
                        <button
                            type="button"
                            class="layout-topbar-action layout-topbar-action-highlight"
                            pStyleClass="@next"
                            enterFromClass="hidden"
                            enterActiveClass="animate-scalein"
                            leaveToClass="hidden"
                            leaveActiveClass="animate-fadeout"
                            [hideOnOutsideClick]="true"
                            aria-label="Personalizar apariencia"
                            pTooltip="Personalizar apariencia"
                            tooltipPosition="bottom"
                            appendTo="body"
                        >
                            <i class="pi pi-palette"></i>
                        </button>
                        <app-configurator />
                    </div>
                </div>

                <app-user-menu />
            </div>
        </div>
        <style>
            /* Título centrado, resaltado y visible en todos los tamaños */
            :host ::ng-deep .layout-topbar-title {
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);

                /* Deja hueco para el logo (izq) y los botones (der) en móvil */
                max-width: 45vw;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;

                color: #fff;
                font-weight: 700;
                font-size: 0.85rem;
                letter-spacing: 0.06em;
                text-transform: uppercase;
                text-align: center;
                line-height: 1.1;

                /* Resalte sutil sobre cualquier fondo del topbar */
                text-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);

                pointer-events: none;
            }
            /* Tablet */
            @media (min-width: 768px) {
                :host ::ng-deep .layout-topbar-title {
                    max-width: 50vw;
                    font-size: 1rem;
                    letter-spacing: 0.05em;
                }
            }

            /* Desktop */
            @media (min-width: 1024px) {
                :host ::ng-deep .layout-topbar-title {
                    max-width: 45vw;
                    font-size: 1.5rem;
                    letter-spacing: 0.03em;
                }
            }
            /* Pantallas muy pequeñas: reduce aún más pero NO lo oculta */
            @media (max-width: 380px) {
                :host ::ng-deep .layout-topbar-title {
                    max-width: 40vw;
                    font-size: 0.75rem;
                    letter-spacing: 0.04em;
                }
            }
        </style>
    `
})
export class AppTopbar {
    layoutService = inject(LayoutService);

    pageTitle = inject(PageTitleService);

    toggleDarkMode() {
        this.layoutService.layoutConfig.update((state) => ({
            ...state,
            darkTheme: !state.darkTheme
        }));
    }
}
