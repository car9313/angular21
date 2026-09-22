import { Injectable, inject } from '@angular/core';
import { AuthRepository } from '../infrastructure/http/auth-repository';
import { TokenAuthService } from '../../../core/services/token-auth.service';
import { SessionStore } from '../../../core/store/session.store';

/**
 * Session rehydration at app boot.
 *
 * The SessionStore is memory-only: on a full page reload (F5) user and
 * permissions are gone even though the tokens survive in storage. Without
 * this use-case the authGuard would bounce a perfectly authenticated user
 * back to /auth/login on every refresh.
 *
 * Flow: restore the token mirror from storage → if there is an access
 * token, re-fetch the identity from the API (never decode it from the
 * token — same rule as login) and hydrate the store. Any failure
 * (expired/invalid tokens, API down) clears everything so the guards see
 * a clean logged-out state.
 *
 * Runs inside provideAppInitializer, BEFORE the router's initial
 * navigation, so the guards never evaluate a half-restored session.
 */
@Injectable({ providedIn: 'root' })
export class RestoreSessionUseCase {
    private readonly repository = inject(AuthRepository);
    private readonly tokenAuth = inject(TokenAuthService);
    private readonly session = inject(SessionStore);

    async execute(): Promise<void> {
        await this.tokenAuth.restore();

        const accessToken = await this.tokenAuth.getAccessToken();
        if (!accessToken) {
            return;
        }

        try {
            const user = await this.repository.getCurrentUser();
            const permissions = user.roles.flatMap((role) => role.permissions);

            this.session.setUser({
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                roles: user.roles.map((role) => role.name)
            });
            this.session.setPermissions(permissions);
        } catch {
            // Tokens present but unusable (expired both, revoked, API down
            // with 401/418): fail closed to a clean logged-out state.
            await this.tokenAuth.clear();
            this.session.reset();
        }
    }
}
