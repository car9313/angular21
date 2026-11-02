import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';
import { QueryParams } from '../interfaces/query-params';
import { PaginatedResponse } from '../interfaces/paginated-response';
import { HttpParamsBuilder } from '../builders/http-params-builder';

@Injectable({ providedIn: 'root' })
export class GenericHttpService {
    private readonly http = inject(HttpClient);
    private readonly config = inject(ConfigService);

    // Header JSON reutilizable
    private get jsonHeaders(): HttpHeaders {
        return new HttpHeaders({ 'Content-Type': 'application/json' });
    }

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

    // ✅ FIX: Si el body es null, enviamos un objeto vacío {} para forzar el header JSON
    update<T>(path: string, body: unknown): Observable<T> {
        return this.http.put<T>(this.url(path), body ?? {}, { headers: this.jsonHeaders });
    }
    delete(path: string): Observable<void> {
        return this.http.delete<void>(this.url(path));
    }

    // ✅ FIX: Añadimos requestResponse para acciones específicas (como cambiar estados)
    requestResponse<T>(method: 'PUT' | 'DELETE' | 'POST', path: string, body?: unknown): Observable<HttpResponse<T>> {
        return this.http.request<T>(method, this.url(path), {
            body: body ?? {}, // Enviamos {} en vez de null
            observe: 'response',
            headers: this.jsonHeaders
        });
    }

    get<T>(path: string, params?: HttpParams): Observable<T> {
        return this.http.get<T>(this.url(path), { params });
    }

    private url(path: string): string {
        return this.config.urlWith(path);
    }
}
