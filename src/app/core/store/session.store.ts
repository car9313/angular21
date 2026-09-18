import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

export interface SessionUser {
    id: string;
    username: string;
    fullName: string;
    roles: string[];
}

export interface Permission {
    resource: string;
    actions: string[];
}

interface SessionState {
    /** Authenticated user, null while logged out. */
    user: SessionUser | null;
    /** Flat permission catalog granted to the current user. */
    permissions: Permission[];
    /** True once the runtime config finished loading (APP_INITIALIZER). */
    configLoaded: boolean;
}

const initialState: SessionState = {
    user: null,
    permissions: [],
    configLoaded: false
};

/**
 * Global session state: identity, permissions and runtime-config readiness.
 *
 * Rules enforced by this store:
 * - ONE writer per field: only the store methods mutate state (patchState).
 * - Derived values are computed, never stored (single source of truth).
 * - Auth use-cases (Fase 2) call setUser/setPermissions; logout calls reset().
 *
 * The theme is deliberately NOT here: it is presentation state with a single
 * legitimate writer (LayoutService). Duplicating it would create two writers.
 */
export const SessionStore = signalStore(
    { providedIn: 'root' },
    withState(initialState),
    withComputed(({ user, permissions }) => ({
        isAuthenticated: computed(() => user() !== null),
        permissionMap: computed(() => {
            const map = new Map<string, Set<string>>();
            permissions().forEach((permission) => map.set(permission.resource, new Set(permission.actions)));
            return map;
        })
    })),
    withMethods((store) => ({
        setUser(user: SessionUser | null): void {
            patchState(store, { user });
        },

        setPermissions(permissions: Permission[]): void {
            patchState(store, { permissions });
        },

        markConfigLoaded(): void {
            patchState(store, { configLoaded: true });
        },

        reset(): void {
            patchState(store, { user: null, permissions: [] });
        },

        /**
         * Core permission check (pure state query).
         * - No authenticated user           → false
         * - No entry for the resource       → false
         * - actions omitted                 → true (any permission on resource)
         * - actions provided                → every action must be granted
         */
        hasPermission(resource: string, actions?: string[]): boolean {
            if (!store.user()) {
                return false;
            }

            const granted = store.permissionMap().get(resource);
            if (!granted) {
                return false;
            }

            if (!actions?.length) {
                return true;
            }

            return actions.every((action) => granted.has(action));
        }
    }))
);