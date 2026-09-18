import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { ConfigService } from './config.service';
import { QueryParams } from '../interfaces/query-params';
import { PaginatedResponse } from '../interfaces/paginated-response';
import { HttpParamsBuilder } from '../builders/http-params-builder';

/**
 * Thin typed wrapper over HttpClient.
 *
 * - Always talks to the backend configured in ConfigService.
 * - Exposes Promise-based methods (async/await style) so application-layer
 *   use-cases and store features stay readable.
 * - Knows the .NET pagination contract via HttpParamsBuilder.
 *
 * This layer must stay DTO-agnostic: feature ApiServices map the wire shapes
 * into domain models on top of these methods.
 */
@Injectable({ providedIn: 'root' })
export class GenericHttpService {
    private readonly http = inject(HttpClient);

    private readonly config = inject(ConfigService);

    /**
     * Paginated list following the .NET contract.
     */
    async getAll<T>(path: string, query: QueryParams): Promise<PaginatedResponse<T>> {
        return lastValueFrom(this.http.get<PaginatedResponse<T>>(this.url(path), { params: HttpParamsBuilder.fromQuery(query) }));
    }

    /**
     * Plain array endpoint (catalogues, option lists, simple lookups).
     */
    async getArray<T>(path: string, params?: HttpParams): Promise<T[]> {
        return lastValueFrom(this.http.get<T[]>(this.url(path), { params }));
    }

    /**
     * Single resource by its full suffix (e.g. `/api/v1/people/42`).
     */
    async getById<T>(path: string): Promise<T> {
        return lastValueFrom(this.http.get<T>(this.url(path)));
    }

    /**
     * Creates a resource and returns the server result (usually with the id).
     */
    async create<T>(path: string, body: unknown): Promise<T> {
        return lastValueFrom(this.http.post<T>(this.url(path), body));
    }

    /**
     * Updates a resource and returns the server result.
     */
    async update<T>(path: string, body: unknown): Promise<T> {
        return lastValueFrom(this.http.put<T>(this.url(path), body));
    }

    async delete(path: string): Promise<void> {
        await lastValueFrom(this.http.delete<void>(this.url(path)));
    }

    private url(path: string): string {
        return this.config.urlWith(path);
    }
}
