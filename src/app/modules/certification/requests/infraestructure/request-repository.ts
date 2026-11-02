import { inject, Injectable } from '@angular/core';
import { GenericHttpService } from '@/app/core/services/generic-http.service';
import { defaultQuery, QueryParams } from '@/app/core/interfaces/query-params';
import { Observable } from 'rxjs';
import { PaginatedResponse } from '@/app/core/interfaces/paginated-response';
import { RequestModel } from '@/app/modules/certification/requests/domain/request';


@Injectable({ providedIn: 'root' })
export class RequestRepository {
    private readonly http = inject(GenericHttpService);

    private readonly endpoint = '/api/v1/certification-request';

    list(query: QueryParams = defaultQuery()): Observable<PaginatedResponse<RequestModel>> {
        return this.http.getAll<RequestModel>(this.endpoint, query);
    }
}
