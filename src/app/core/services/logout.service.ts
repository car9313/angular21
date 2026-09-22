import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpBackend } from '@angular/common/http';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { ConfigService } from './config.service';
import { SessionStore } from '../store/session.store';
import { TokenAuthService } from './token-auth.service';

const LOGIN_PATH = '/auth/login';

/**
 * Application logout use-case: best-effort server-side token revocation,
 * followed by unconditional local cleanup and navigation to the login page.
 *
 * The revocation call uses a raw HttpBackend client (same rationale as
 * TokenAuthService.refreshAccess): it must BYPASS every interceptor, so a
 * failing call on an already-broken session can never re-enter the auth
 * interceptor and trigger a redirect loop.
 *
 * Server revocation is best-effort by contract: local cleanup and navigation
 * ALWAYS happen, even when the HTTP call fails.
 */
@Injectable({ providedIn: 'root' })
export class LogoutService {
    private readonly rawHttp = new HttpClient(inject(HttpBackend));
    private readonly config = inject(ConfigService);
    private readonly tokenAuth = inject(TokenAuthService);
    private readonly session = inject(SessionStore);
    private readonly router = inject(Router);

    async logout(): Promise<void> {
        const refreshToken = await this.tokenAuth.getRefreshToken();

        try {
            await lastValueFrom(this.rawHttp.post<void>(`${this.config.url}/api/auth/logout`, { refreshToken }));
        } catch {
            // Best-effort by design: unreachable backend or already-invalidated
            // session must not block the user from leaving.
        }

        await this.tokenAuth.clear();
        this.session.reset();
        await this.router.navigate([LOGIN_PATH]);
    }
}
