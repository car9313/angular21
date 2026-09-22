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
    /** Access token lifetime in seconds. */
    expiresIn: number;
    refreshTokenExpiresIn: string;
}

export interface SessionUserDto {
    id: string;
    username: string;
    fullName: string;
    roles: { name: string; permissions: { resource: string; actions: string[] }[] }[];
}
