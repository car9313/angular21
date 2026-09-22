/**
 * Auth wire contracts (reference backend, .NET).
 * Key casing matters: the backend serializes camelCase here, EXCEPT the
 * refresh call which uses PascalCase `{ RefreshToken }` (see token-auth.service).
 */
export interface LoginResponseBody {
    accessToken: string;
    tokenType: string;
    issuedAt: string;
    refreshToken: string;
    /** Access token lifetime in MINUTES (backend contract, confirmed 2026-09-22; the body is the source of truth). */
    expiresIn: number;
    /** Refresh token lifetime in MINUTES. */
    refreshTokenExpiresIn: number;
}

export interface SessionUserDto {
    id: string;
    username: string;
    fullName: string;
    roles: { name: string; permissions: { resource: string; actions: string[] }[] }[];
}
