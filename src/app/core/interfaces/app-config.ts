/**
 * Runtime configuration contract loaded by ConfigService from
 * /assets/config.{env}.json. Only the build-time `environment.ts` knows
 * which file to load.
 *
 * Keep sensitive values OUT of the repository: deploy them via the runtime
 * JSON (not committed to source control) or a secrets manager.
 */
export interface AppConfig {
    serverApi: string;
    [key: string]: unknown;
}
