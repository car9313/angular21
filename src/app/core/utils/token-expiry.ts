/**
 * Token lifetime conversion (backend contract, confirmed 2026-09-22):
 * `expiresIn` and `refreshTokenExpiresIn` come in MINUTES. The response
 * BODY is the source of truth — the JWT's own exp/nbf claims run on a
 * separate server setting and are NOT authoritative for the client.
 *
 * History: devueltos (the reference project) interpreted these values as
 * seconds; the live backend proved the real unit is minutes (a login body
 * of 1000 matched the JWT's exact 60 000 s span). This helper is the single
 * conversion point so the unit can never drift between call sites.
 */
const MS_PER_MINUTE = 60_000;

export function expiryFromLifetime(lifetime: number | string): number {
    return Date.now() + Number(lifetime) * MS_PER_MINUTE;
}
