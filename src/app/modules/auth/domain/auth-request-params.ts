/** Login request wire contract (reference backend). */
export interface AuthRequestParams {
    username: string;
    password: string;
    /** Anonymous device identifier persisted client-side (crypto.randomUUID). */
    fingerprint: string;
}
