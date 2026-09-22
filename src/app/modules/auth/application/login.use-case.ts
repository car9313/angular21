import { Injectable, inject } from '@angular/core';
import { AuthRepository } from '../infrastructure/http/auth-repository';
import { FingerprintService } from '../infrastructure/fingerprint.service';
import { TokenAuthService } from '../../../core/services/token-auth.service';
import { expiryFromLifetime } from '../../../core/utils/token-expiry';
import { SessionStore } from '../../../core/store/session.store';

/**
 * Login orchestration: authenticate → persist tokens → fetch identity from
 * the API → hydrate the SessionStore.
 *
 * Per the project constitution: this use-case owns the IO and navigation
 * concerns; the SessionStore only receives pure writes (setUser/setPermissions).
 * Identity and permissions ALWAYS come from the API, never from the token.
 *
 * Errors: invalid credentials surface as HTTP 401 from the repository and
 * propagate to the caller (the login page owns user-facing messaging).
 */
@Injectable({ providedIn: 'root' })
export class LoginUseCase {
    private readonly repository = inject(AuthRepository);
    private readonly fingerprint = inject(FingerprintService);
    private readonly tokenAuth = inject(TokenAuthService);
    private readonly session = inject(SessionStore);

    async execute(username: string, password: string): Promise<void> {
        // PERSISTENT device fingerprint (generated once, stored, reused):
        // the backend's single-session rule recognizes the browser by it.
        const fingerprint = await this.fingerprint.get();
        const tokens = await this.repository.login({ username, password, fingerprint });

        // Access token must be persisted BEFORE getCurrentUser: the Bearer
        // interceptor needs it for the identity call.
        // Lifetimes are MINUTES per the backend contract (see token-expiry).
        await this.tokenAuth.persist({
            access: tokens.accessToken,
            refresh: tokens.refreshToken,
            expiration: expiryFromLifetime(tokens.expiresIn),
            refreshExpiration: expiryFromLifetime(tokens.refreshTokenExpiresIn)
        });

        const user = await this.repository.getCurrentUser();

        // Flatten role-embedded permissions into the store's flat catalog.
        const permissions = user.roles.flatMap((role) => role.permissions);

        this.session.setUser({
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            roles: user.roles.map((role) => role.name)
        });
        this.session.setPermissions(permissions);
    }
}
