import { inject } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, Subject, catchError, switchMap, take, throwError } from 'rxjs';
import { TokenAuthService } from '../services/token-auth.service';

/**
 * URLs that never carry the Authorization header and never trigger the
 * 401-refresh flow.
 *
 * Endpoint-specific, NOT a blanket `/api/auth/` prefix: the auth controller
 * also serves `user/current`, which REQUIRES the Bearer header. The blanket
 * prefix silently stripped that header and made login fail with a 401 on
 * the identity call (caught in runtime testing 2026-09-22).
 *
 * The login request must NEVER hit the 401-refresh logic: a stale token on
 * a login attempt would otherwise trigger a refresh round-trip. A bare
 * `includes('/login')` is still avoided on purpose (`/login-attempts`,
 * `/users/login-history` false positives). `refresh-token` and `logout` go
 * through the raw HttpBackend (interceptor-bypassed); they stay listed as
 * defense-in-depth in case they ever move to HttpClient.
 */
const NO_AUTH_URLS = ['/assets/config.', '/api/auth/login', '/api/auth/refresh-token', '/api/auth/logout'];

/**
 * Optional endpoints where a 403 must NOT redirect to the access-denied page
 * (e.g. permissive catalogue lookups). Empty by default.
 */
const EXCLUDED_403_URLS: string[] = [];

const LOGOUT_ROUTE = '/auth/login';
const ACCESS_DENIED_ROUTE = '/auth/access';

/**
 * Single-flight refresh queue shared by every parallel 401.
 *
 * The FIRST 401 creates the queue and starts ONE refresh; every other 401
 * (including the originator) waits on the same Subject for the result.
 * A plain Subject (no replay) guarantees nobody receives the value before
 * the refresh actually resolves. Cleanup is identity-guarded so a late 401
 * can never subscribe to a stale queue.
 */
let refreshQueue: Subject<string | null> | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const tokenAuth = inject(TokenAuthService);
    const router = inject(Router);

    if (NO_AUTH_URLS.some((url) => req.url.includes(url))) {
        return next(req);
    }

    // Synchronous attach: the token mirror lives in a signal.
    const token = tokenAuth.accessToken();
    const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

    return next(authReq).pipe(
        catchError((error: unknown) => {
            // Normalize once: keep real HttpErrorResponse (body/headers/url)
            // intact, wrap anything else so no branch re-checks the type.
            const httpError = error instanceof HttpErrorResponse ? error : new HttpErrorResponse({ status: 0, error });

            if (httpError.status === 418) {
                // Backend forced the session to end: clear + redirect.
                void logoutAndRedirect(tokenAuth, router);
                return throwError(() => httpError);
            }

            if (httpError.status === 401) {
                return handleUnauthorized(httpError, req, next, tokenAuth, router);
            }

            // 403 (or any other status): side effect (redirect) with a single
            // throw exit — nothing can be added after this block by mistake.
            if (httpError.status === 403 && !EXCLUDED_403_URLS.some((url) => req.url.includes(url))) {
                void router.navigateByUrl(ACCESS_DENIED_ROUTE);
            }

            return throwError(() => httpError);
        })
    );
};

function handleUnauthorized(original: HttpErrorResponse, req: HttpRequest<unknown>, next: HttpHandlerFn, tokenAuth: TokenAuthService, router: Router): Observable<HttpEvent<unknown>> {
    const queue = refreshQueue ?? createRefreshQueue(tokenAuth);

    return queue.pipe(
        take(1),
        switchMap((newToken) => {
            if (newToken === null) {
                // Refresh failed: the session cannot recover.
                void logoutAndRedirect(tokenAuth, router);
                return throwError(() => original);
            }

            // Retry the ORIGINAL request (no stale Authorization header) and
            // set the fresh token — never rebuild from authReq, so a leftover
            // header can never survive into the retry.
            return next(req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }));
        })
    );
}

function createRefreshQueue(tokenAuth: TokenAuthService): Subject<string | null> {
    const queue = new Subject<string | null>();
    refreshQueue = queue;

    void tokenAuth
        .refreshAccess()
        .then((token) => {
            queue.next(token);
        })
        .catch(() => {
            queue.next(null);
        })
        .finally(() => {
            queue.complete();
            // Deterministic cleanup: only clear the shared slot if this queue
            // is still the one being served.
            if (refreshQueue === queue) {
                refreshQueue = null;
            }
        });

    return queue;
}

async function logoutAndRedirect(tokenAuth: TokenAuthService, router: Router): Promise<void> {
    await tokenAuth.clear();
    await router.navigateByUrl(LOGOUT_ROUTE);
}