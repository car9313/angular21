import { inject, Injectable } from '@angular/core';
import { GenericHttpService } from '@/app/core/services/generic-http.service';
import { defaultQuery, QueryParams } from '@/app/core/interfaces/query-params';
import { Observable } from 'rxjs';
import { PaginatedResponse } from '@/app/core/interfaces/paginated-response';

import { HttpResponse } from '@angular/common/http';
import { Municipality } from '@/app/modules/nomenclators/municipalities/domain/municipality';

export interface MunicipalityPayload {
    code: string;
    descShort: string;
    descLong: string;
}

@Injectable({
    providedIn: 'root'
})
export class MunicipalityRepository {
    private readonly endpoint = '/api/municipality';
    private readonly http = inject(GenericHttpService);

    list(query: QueryParams = defaultQuery()): Observable<PaginatedResponse<Municipality>> {
        return this.http.getAll<Municipality>(`${this.endpoint}/all`, query);
    }

    getById(code: string): Observable<Municipality> {
        return this.http.getById<Municipality>(`${this.endpoint}/${code}`);
    }

    create(payload: MunicipalityPayload): Observable<Municipality> {
        return this.http.create<Municipality>(this.endpoint, payload);
    }

    update(code: string, payload: MunicipalityPayload): Observable<Municipality> {
        return this.http.update<Municipality>(`${this.endpoint}/${code}`, payload);
    }

    activate(code: string): Observable<HttpResponse<void>> {
        return this.http.requestResponse<void>('PUT', `${this.endpoint}/activate/${code}`);
    }

    deactivate(code: string): Observable<HttpResponse<void>> {
        return this.http.requestResponse<void>('DELETE', `${this.endpoint}/${code}`);
    }
}
