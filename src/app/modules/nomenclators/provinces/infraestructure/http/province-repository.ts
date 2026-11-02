import { inject, Injectable } from '@angular/core';
import { GenericHttpService } from '@/app/core/services/generic-http.service';
import { defaultQuery, QueryParams } from '@/app/core/interfaces/query-params';
import { Observable } from 'rxjs';
import { PaginatedResponse } from '@/app/core/interfaces/paginated-response';
import { Province } from '@/app/modules/nomenclators/provinces/domain/province';
import { HttpResponse } from '@angular/common/http';

export interface ProvincePayload {
    code: string;
    descShort: string;
    descLong: string;
}

@Injectable({
    providedIn: 'root'
})
export class ProvinceRepository {
    private readonly endpoint = '/api/province';
    private readonly http = inject(GenericHttpService);

    list(query: QueryParams = defaultQuery()): Observable<PaginatedResponse<Province>> {
        return this.http.getAll<Province>(`${this.endpoint}/all`, query);
    }

    getById(code: string): Observable<Province> {
        return this.http.getById<Province>(`${this.endpoint}/${code}`);
    }

    create(payload: ProvincePayload): Observable<Province> {
        return this.http.create<Province>(this.endpoint, payload);
    }

    update(code: string, payload: ProvincePayload): Observable<Province> {
        return this.http.update<Province>(`${this.endpoint}/${code}`, payload);
    }

    activate(code: string): Observable<HttpResponse<void>> {
        return this.http.requestResponse<void>('PUT', `${this.endpoint}/activate/${code}`);
    }

    deactivate(code: string): Observable<HttpResponse<void>> {
        return this.http.requestResponse<void>('DELETE', `${this.endpoint}/${code}`);
    }
}
