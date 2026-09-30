import { inject, Injectable } from '@angular/core';
import { MenuItem } from 'primeng/api';


import { PermissionContext, PermissionContextResolver, TableAction } from '../interfaces/table-action';
import { SessionStore } from '@/app/core/store/session.store';

@Injectable()
export class TableActionMenuService<T extends object> {
    /**
     * Cache is keyed by ROW REFERENCE. Entities replaced by setAllEntities get
     * new references, so stale menu models are never served — but the caches
     * grow unbounded across page loads. Clear them when a screen reloads
     * (call clearMenuCache after setAllEntities) or drop the cache entirely.
     */
    private readonly menuCache = new Map<T, MenuItem[]>();
    private readonly menuStates = new Map<T, boolean>();

    private readonly session = inject(SessionStore);

    getMenuModel(row: T, actions: TableAction<T>[]): MenuItem[] {
        const cached = this.menuCache.get(row);
        if (cached) return cached;

        const model = actions
            .filter((action) => !action.visible || action.visible(row))
            .filter((action) => this.can(row, action))
            .map((action) => ({
                label: action.label,
                icon: action.icon,
                disabled: action.disabled ? action.disabled(row) : false,
                command: () => action.command(row)
            }));

        this.menuCache.set(row, model);
        return model;
    }

    hasAnyAction(row: T, actions: TableAction<T>[]): boolean {
        return actions.some((action) => {
            const isVisible = !action.visible || action.visible(row);
            return isVisible && this.can(row, action);
        });
    }

    onMenuShow(row: T): void {
        this.menuStates.set(row, true);
    }

    onMenuHide(row: T): void {
        this.menuStates.set(row, false);
    }

    isMenuOpen(row: T): boolean {
        return this.menuStates.get(row) ?? false;
    }

    clearMenuCache(): void {
        this.menuCache.clear();
        this.menuStates.clear();
    }

    private can(row: T, action: TableAction<T>): boolean {
        const permission = this.resolvePermission(action.permission, row);
        return this.session.hasPermission(permission.resource, [permission.action]);
    }

    private resolvePermission(permission: PermissionContextResolver<T>, row: T): PermissionContext {
        return typeof permission === 'function' ? permission(row) : permission;
    }
}
