import { Injectable, inject } from '@angular/core';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from '@/environments/environment';
import { AppConfig } from '../interfaces/app-config';

/**
 * Loads the runtime configuration (server API URL, feature flags, ...) from
 * /assets/config.{env}.json before the application bootstraps.
 *
 * Uses a raw HttpClient over HttpBackend on purpose: this request happens
 * BEFORE authentication, so it must bypass any registered interceptor
 * (token header, refresh logic, error handling).
 */
@Injectable({ providedIn: 'root' })
export class ConfigService {
    private readonly rawHttp = new HttpClient(inject(HttpBackend));

    private config: AppConfig | null = null;

    async load(): Promise<void> {
        const runtimeConfig = await lastValueFrom(this.rawHttp.get<AppConfig>(`/assets/config.${environment.env}.json`));

        if (!runtimeConfig?.serverApi) {
            throw new Error('Invalid configuration: serverApi is not defined');
        }

        this.config = runtimeConfig;
    }

    /**
     * Base URL of the backend API.
     * Throws when config was not loaded yet.
     */
    get url(): string {
        if (!this.config?.serverApi) {
            throw new Error('Configuration not loaded: serverApi is not available');
        }

        return this.config.serverApi;
    }

    urlWith(subUrl: string): string {
        return `${this.url}${subUrl}`;
    }

    /**
     * Typed access to any runtime value. Unknown keys are 'undefined'
     * because AppConfig has an index signature: access is safe by design.
     */
    get<T extends keyof AppConfig>(key: T): AppConfig[T] | undefined {
        return this.config?.[key];
    }
}
