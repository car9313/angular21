import { Component, computed, inject, input, signal, ChangeDetectionStrategy, afterNextRender } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgClass } from '@angular/common';
import { RippleModule } from 'primeng/ripple';
import { MenuItem } from 'primeng/api';
import { LayoutService } from '@/app/layout/service/layout.service';

interface AppMenuItem extends MenuItem {
    path?: string;
    class?: string;
    badgeClass?: string;
}

@Component({
    selector: '[app-menuitem]',
    imports: [RouterModule, NgClass, RippleModule],
    template: `
        @if (root() && isVisible()) {
            <div class="layout-menuitem-root-text">{{ item().label }}</div>
        }

        @if (isVisible()) {
            @if (hasRouterLink() && !hasChildren()) {
                <a
                    (click)="itemClick($event)"
                    [ngClass]="item().class"
                    [routerLink]="item().routerLink"
                    routerLinkActive="active-route"
                    [routerLinkActiveOptions]="item().routerLinkActiveOptions || { paths: 'exact', queryParams: 'ignored', matrixParams: 'ignored', fragment: 'ignored' }"
                    [fragment]="item().fragment"
                    [queryParamsHandling]="item().queryParamsHandling"
                    [preserveFragment]="item().preserveFragment"
                    [skipLocationChange]="item().skipLocationChange"
                    [replaceUrl]="item().replaceUrl"
                    [state]="item().state"
                    [queryParams]="item().queryParams"
                    [attr.target]="item().target"
                    tabindex="0"
                    pRipple
                >
                    <i [ngClass]="item().icon" class="layout-menuitem-icon"></i>
                    <span class="layout-menuitem-text">{{ item().label }}</span>
                </a>
            } @else {
                <a
                    [attr.href]="item().url"
                    (click)="itemClick($event)"
                    [ngClass]="item().class"
                    [attr.target]="item().target"
                    [attr.aria-expanded]="hasChildren() ? isExpanded() : null"
                    [attr.aria-haspopup]="hasChildren() ? true : null"
                    [class.submenu-expanded]="hasChildren() && isExpanded()"
                    tabindex="0"
                    pRipple
                >
                    <i [ngClass]="item().icon" class="layout-menuitem-icon"></i>
                    <span class="layout-menuitem-text">{{ item().label }}</span>
                    @if (hasChildren()) {
                        <i class="pi pi-fw pi-angle-down layout-submenu-toggler"></i>
                    }
                </a>
            }
        }

        @if (hasChildren() && isVisible()) {
            <div class="submenu-wrap" [class.initialized]="initialized()" [class.expanded]="isExpanded()">
                <ul [class.layout-root-submenulist]="root()" [attr.inert]="isExpanded() ? null : ''">
                    @for (child of item().items ?? []; track child.label) {
                        <li app-menuitem [item]="child" [parentPath]="fullPath()" [parentKey]="groupKey()" [root]="false" [class]="child['badgeClass']"></li>
                    }
                </ul>
            </div>
        }
    `,
    host: {
        '[class.active-menuitem]': 'isActive()',
        '[class.layout-root-menuitem]': 'root()'
    },
    changeDetection: ChangeDetectionStrategy.OnPush,
    styles: [
        `
            .submenu-wrap {
                display: grid;
                grid-template-rows: 0fr;
            }
            .submenu-wrap.initialized {
                transition: grid-template-rows 220ms cubic-bezier(0.4, 0, 0.2, 1);
            }
            .submenu-wrap.expanded {
                grid-template-rows: 1fr;
            }
            .submenu-wrap > ul {
                overflow: hidden;
                min-height: 0;
            }
        `
    ]
})
export class AppMenuitem {
    private readonly layoutService = inject(LayoutService);

    item = input<AppMenuItem>({});
    root = input<boolean>(false);
    parentPath = input<string | null>(null);
    parentKey = input<string>('');

    readonly isVisible = computed(() => this.item()?.visible !== false);

    readonly hasChildren = computed(() => (this.item()?.items?.length ?? 0) > 0);

    readonly hasRouterLink = computed(() => {
        const link = this.item()?.routerLink;
        return Array.isArray(link) ? link.length > 0 : !!link;
    });

    readonly fullPath = computed(() => this.item()?.path ?? this.parentPath());

    /** Identificador estable para `expandedGroups`. Cadena de labels, no URLs. */
    readonly groupKey = computed(() => {
        const parent = this.parentKey();
        const label = this.item()?.label ?? '';
        return parent ? `${parent}/${label}` : label;
    });

    /** Solo highlight. NO controla expansión. */
    readonly isActive = computed(() => {
        const activePath = this.layoutService.layoutState().activePath;
        if (!activePath) return false;

        const item = this.item();
        if (!item) return false;

        if (item.path) {
            return activePath.startsWith(this.fullPath() ?? '');
        }
        return this.hasActiveDescendant(item.items ?? [], activePath);
    });

    /** Solo expansión. Depende de `expandedGroups`, no de `isActive`. */
    readonly isExpanded = computed(() => {
        if (this.root()) return true;
        return this.layoutService.layoutState().expandedGroups.includes(this.groupKey());
    });

    readonly initialized = signal(false);

    constructor() {
        afterNextRender(() => this.initialized.set(true));
    }

    private hasActiveDescendant(items: AppMenuItem[], activePath: string): boolean {
        return items.some((child) => {
            const leafPath = child.path ?? child.routerLink?.[0];
            if (leafPath && activePath.startsWith(leafPath)) return true;
            return child.items?.length ? this.hasActiveDescendant(child.items, activePath) : false;
        });
    }

    itemClick(event: Event): void {
        const item = this.item();

        if (item?.disabled) {
            event.preventDefault();
            return;
        }

        if (item?.command) {
            item.command({ originalEvent: event, item });
        }

        if (this.hasChildren()) {
            event.preventDefault();

            const key = this.groupKey();
            this.layoutService.layoutState.update((val) => {
                const expanded = val.expandedGroups;
                const next = expanded.includes(key) ? expanded.filter((k) => k !== key) : [...expanded, key];
                return { ...val, expandedGroups: next, menuHoverActive: true };
            });
            return;
        }

        this.layoutService.layoutState.update((val) => ({
            ...val,
            overlayMenuActive: false,
            staticMenuMobileActive: false,
            mobileMenuActive: false,
            menuHoverActive: false
        }));
    }
}
