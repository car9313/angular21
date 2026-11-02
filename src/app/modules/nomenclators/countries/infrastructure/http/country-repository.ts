import { inject, Injectable } from '@angular/core';
import { GenericHttpService } from '@/app/core/services/generic-http.service';
import { defaultQuery, QueryParams } from '@/app/core/interfaces/query-params';
import { Observable } from 'rxjs';
import { PaginatedResponse } from '@/app/core/interfaces/paginated-response';
import { Country } from '@/app/modules/nomenclators/countries/domain/country';
import { HttpResponse } from '@angular/common/http';

export interface CountryPayload {
    name: string;
    code: string;
}

@Injectable({
    providedIn: 'root'
})
export class CountryRepository {
    private readonly endpoint = '/api/country';
    private readonly http = inject(GenericHttpService);

    list(query: QueryParams = defaultQuery()): Observable<PaginatedResponse<Country>> {
        return this.http.getAll<Country>(`${this.endpoint}/all`, query);
    }

    getById(code: string): Observable<Country> {
        return this.http.getById<Country>(`${this.endpoint}/${code}`);
    }

    create(payload: CountryPayload): Observable<Country> {
        return this.http.create<Country>(this.endpoint, payload);
    }

    update(code: string, payload: CountryPayload): Observable<Country> {
        return this.http.update<Country>(`${this.endpoint}/${code}`, payload);
    }
    activate(code: string): Observable<HttpResponse<void>> {
        return this.http.requestResponse<void>('PUT', `${this.endpoint}/activate/${code}`);
    }

    deactivate(code: string): Observable<HttpResponse<void>> {
        return this.http.requestResponse<void>('DELETE', `${this.endpoint}/${code}`);
    }
}
