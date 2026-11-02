import { inject, Injectable } from '@angular/core';
import { GenericHttpService } from '@/app/core/services/generic-http.service';
import { defaultQuery, QueryParams } from '@/app/core/interfaces/query-params';
import { map, Observable } from 'rxjs';
import { PaginatedResponse } from '@/app/core/interfaces/paginated-response';
import { Country, CountryInput } from '@/app/modules/nomenclators/countries/domain/country';
import { HttpResponse } from '@angular/common/http';
import { CountryDto } from '@/app/modules/nomenclators/countries/infrastructure/dtos/country.dto';
import { CountryMapper } from '@/app/modules/nomenclators/countries/infrastructure/mappers/country.mapper';

@Injectable({
    providedIn: 'root'
})
export class CountryRepository {
    private readonly endpoint = '/api/country';
    private readonly http = inject(GenericHttpService);

    list(query: QueryParams = defaultQuery()): Observable<PaginatedResponse<Country>> {
        return this.http.getAll<CountryDto>(`${this.endpoint}/all`, query).pipe(
            map((response) => ({
                objects: response.objects.map((dto) => CountryMapper.toDomain(dto)),
                meta: response.meta
            }))
        );
    }

    getById(code: string): Observable<Country> {
        return this.http.getById<CountryDto>(`${this.endpoint}/${code}`).pipe(map((dto) => CountryMapper.toDomain(dto)));
    }

    create(input: CountryInput): Observable<Country> {
        return this.http.create<CountryDto>(this.endpoint, CountryMapper.toWriteDto(input)).pipe(map((dto) => CountryMapper.toDomain(dto)));
    }

    update(code: string, input: CountryInput): Observable<Country> {
        return this.http.update<CountryDto>(`${this.endpoint}/${code}`, CountryMapper.toWriteDto(input)).pipe(map((dto) => CountryMapper.toDomain(dto)));
    }

    activate(code: string): Observable<HttpResponse<void>> {
        return this.http.requestResponse<void>('PUT', `${this.endpoint}/activate/${code}`);
    }

    deactivate(code: string): Observable<HttpResponse<void>> {
        return this.http.requestResponse<void>('DELETE', `${this.endpoint}/${code}`);
    }
}
