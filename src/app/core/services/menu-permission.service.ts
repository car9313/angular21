import { Injectable, inject } from '@angular/core';
import { SessionStore } from '../store/session.store';
import { SecuredMenuItem } from '../constants/menu';
import { ACTIONS } from '../constants/actions';

/**
 * Recursive RBAC filter for the menu tree.
 *
 * Reads the SessionStore via SIGNALS: the computed consumers re-evaluate on
 * every login/logout/permission change. (The devueltos reference filtered
 * once from plain getters — the menu never updated after auth changes.)
 */
@Injectable({ providedIn: 'root' })
export class MenuPermissionService {
    private readonly session = inject(SessionStore);

    filterByPermission(items: SecuredMenuItem[]): SecuredMenuItem[] {
        return items
            .map((item) => this.filterItem(item))
            .filter((item): item is SecuredMenuItem => item !== null);
    }

    private filterItem(item: SecuredMenuItem): SecuredMenuItem | null {
        if (!this.isVisible(item)) {
            return null;
        }

        if (!item.items?.length) {
            return item;
        }

        const children = this.filterByPermission(item.items);

        // A group whose whole subtree is hidden disappears too — never render
        // an empty menu folder.
        if (children.length === 0) {
            return null;
        }

        return { ...item, items: children };
    }

    private isVisible(item: SecuredMenuItem): boolean {
        if (item.alwaysVisible) {
            return true;
        }

        if (!item.resource) {
            return true;
        }

        return this.session.hasPermission(item.resource, item.requiredActions ?? [ACTIONS.Read]);
    }
}