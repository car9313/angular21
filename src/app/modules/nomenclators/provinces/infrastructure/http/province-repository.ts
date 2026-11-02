import { inject, Injectable } from '@angular/core';
import { GenericHttpService } from '@/app/core/services/generic-http.service';
import { defaultQuery, QueryParams } from '@/app/core/interfaces/query-params';
import { map, Observable } from 'rxjs';
import { PaginatedResponse } from '@/app/core/interfaces/paginated-response';
import { Province, ProvinceInput, ProvincePage } from '@/app/modules/nomenclators/provinces/domain/province';
import { HttpParams, HttpResponse } from '@angular/common/http';
import { ProvinceDto, ProvincePageDto } from '@/app/modules/nomenclators/provinces/infrastructure/dtos/province.dto';
import { ProvinceMapper } from '@/app/modules/nomenclators/provinces/infrastructure/mappers/province.mapper';

@Injectable({
    providedIn: 'root'
})
export class ProvinceRepository {
    private readonly endpoint = '/api/province';
    private readonly http = inject(GenericHttpService);

    list(query: QueryParams = defaultQuery()): Observable<PaginatedResponse<Province>> {
        return this.http.getAll<ProvinceDto>(`${this.endpoint}/all`, query).pipe(
            map((response) => ({
                objects: response.objects.map((dto) => ProvinceMapper.toDomain(dto)),
                meta: response.meta
            }))
        );
    }

    listForSelect(cursor?: string, filter?: string): Observable<ProvincePage> {
        let params = new HttpParams();

        if (cursor) params = params.set('Cursor', cursor);
        if (filter) params = params.set('Filter', filter);

        return this.http.get<ProvincePageDto>(this.endpoint, params).pipe(
            map((response) => ({
                objects: response.objects.map((dto) => ProvinceMapper.toDomain(dto)),
                nextCursor: response.nextCursor
            }))
        );
    }

    getById(code: string): Observable<Province> {
        return this.http.getById<ProvinceDto>(`${this.endpoint}/${code}`).pipe(map((dto) => ProvinceMapper.toDomain(dto)));
    }

    create(input: ProvinceInput): Observable<Province> {
        return this.http.create<ProvinceDto>(this.endpoint, ProvinceMapper.toWriteDto(input)).pipe(map((dto) => ProvinceMapper.toDomain(dto)));
    }

    update(code: string, input: ProvinceInput): Observable<Province> {
        return this.http.update<ProvinceDto>(`${this.endpoint}/${code}`, ProvinceMapper.toWriteDto(input)).pipe(map((dto) => ProvinceMapper.toDomain(dto)));
    }

    activate(code: string): Observable<HttpResponse<void>> {
        return this.http.requestResponse<void>('PUT', `${this.endpoint}/activate/${code}`);
    }

    deactivate(code: string): Observable<HttpResponse<void>> {
        return this.http.requestResponse<void>('DELETE', `${this.endpoint}/${code}`);
    }
}
