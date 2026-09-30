import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';
import { QueryParams } from '../interfaces/query-params';
import { PaginatedResponse } from '../interfaces/paginated-response';
import { HttpParamsBuilder } from '../builders/http-params-builder';

@Injectable({ providedIn: 'root' })
export class GenericHttpService {
    private readonly http = inject(HttpClient);
    private readonly config = inject(ConfigService);

    /**
     * Paginated list following the .NET contract.
     * Returns Observable so callers can cancel via switchMap/unsubscribe.
     */
    getAll<T>(path: string, query: QueryParams): Observable<PaginatedResponse<T>> {
        return this.http.get<PaginatedResponse<T>>(this.url(path), {
            params: HttpParamsBuilder.fromQuery(query)
        });
    }

    getArray<T>(path: string, params?: HttpParams): Observable<T[]> {
        return this.http.get<T[]>(this.url(path), { params });
    }

    getById<T>(path: string): Observable<T> {
        return this.http.get<T>(this.url(path));
    }

    create<T>(path: string, body: unknown): Observable<T> {
        return this.http.post<T>(this.url(path), body);
    }

    update<T>(path: string, body: unknown): Observable<T> {
        return this.http.put<T>(this.url(path), body);
    }

    delete(path: string): Observable<void> {
        return this.http.delete<void>(this.url(path));
    }

    private url(path: string): string {
        return this.config.urlWith(path);
    }
}
