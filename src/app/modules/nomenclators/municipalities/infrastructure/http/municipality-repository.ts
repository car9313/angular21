import { inject, Injectable } from '@angular/core';
import { GenericHttpService } from '@/app/core/services/generic-http.service';
import { defaultQuery, QueryParams } from '@/app/core/interfaces/query-params';
import { map, Observable } from 'rxjs';
import { PaginatedResponse } from '@/app/core/interfaces/paginated-response';
import { HttpParams, HttpResponse } from '@angular/common/http';
import { Municipality, MunicipalityInput, MunicipalityPage } from '@/app/modules/nomenclators/municipalities/domain/municipality';
import { MunicipalityDto, MunicipalityPageDto } from '@/app/modules/nomenclators/municipalities/infrastructure/dtos/municipality.dto';
import { MunicipalityMapper } from '@/app/modules/nomenclators/municipalities/infrastructure/mappers/municipality.mapper';

@Injectable({
    providedIn: 'root'
})
export class MunicipalityRepository {
    private readonly endpoint = '/api/municipality';
    private readonly http = inject(GenericHttpService);

    list(query: QueryParams = defaultQuery()): Observable<PaginatedResponse<Municipality>> {
        return this.http.getAll<MunicipalityDto>(`${this.endpoint}/all`, query).pipe(
            map((response) => ({
                objects: response.objects.map((dto) => MunicipalityMapper.toDomain(dto)),
                meta: response.meta
            }))
        );
    }

    listByProvince(provinceCode: string, cursor?: string, filter?: string): Observable<MunicipalityPage> {
        let params = new HttpParams();

        if (cursor) params = params.set('Cursor', cursor);
        if (filter) params = params.set('Filter', filter);

        return this.http.get<MunicipalityPageDto>(`${this.endpoint}/province/${provinceCode}`, params).pipe(
            map((response) => ({
                objects: response.objects.map((dto) => MunicipalityMapper.toDomain(dto)),
                nextCursor: response.nextCursor
            }))
        );
    }

    getById(code: string): Observable<Municipality> {
        return this.http.getById<MunicipalityDto>(`${this.endpoint}/${code}`).pipe(map((dto) => MunicipalityMapper.toDomain(dto)));
    }

    create(input: MunicipalityInput): Observable<Municipality> {
        return this.http.create<MunicipalityDto>(this.endpoint, MunicipalityMapper.toWriteDto(input)).pipe(map((dto) => MunicipalityMapper.toDomain(dto)));
    }

    update(code: string, input: MunicipalityInput): Observable<Municipality> {
        return this.http.update<MunicipalityDto>(`${this.endpoint}/${code}`, MunicipalityMapper.toWriteDto(input)).pipe(map((dto) => MunicipalityMapper.toDomain(dto)));
    }

    activate(code: string): Observable<HttpResponse<void>> {
        return this.http.requestResponse<void>('PUT', `${this.endpoint}/activate/${code}`);
    }

    deactivate(code: string): Observable<HttpResponse<void>> {
        return this.http.requestResponse<void>('DELETE', `${this.endpoint}/${code}`);
    }
}
