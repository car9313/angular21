import { Injectable, inject } from '@angular/core';
import { SessionStore } from '../../../core/store/session.store';
import { SessionUserDto } from '../domain/auth-response-body';

/**
 * Projects the wire identity (GET /api/auth/user/current) into the
 * SessionStore: display identity + role-embedded permissions flattened into
 * the store's flat `{resource, actions[]}[]` catalog.
 *
 * Single home for that projection so the three places that hydrate identity
 * (login, boot restore, 403 self-heal) cannot drift apart.
 *
 * Pure: no IO, no navigation — the calling use-case owns those concerns.
 */
@Injectable({ providedIn: 'root' })
export class IdentityHydrator {
    private readonly session = inject(SessionStore);

    apply(user: SessionUserDto): void {
        this.session.setUser({
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            roles: user.roles.map((role) => role.name)
        });
        this.session.setPermissions(user.roles.flatMap((role) => role.permissions));
    }
}
