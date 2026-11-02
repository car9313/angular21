import { inject, Injectable } from '@angular/core';
import { GenericHttpService } from '@/app/core/services/generic-http.service';
import { defaultQuery, QueryParams } from '@/app/core/interfaces/query-params';
import { Observable } from 'rxjs';
import { PaginatedResponse } from '@/app/core/interfaces/paginated-response';
import { Audit } from '@/app/modules/security/audits/domain/audit';
import { ActionType } from '@/app/modules/security/audits/domain/action-type';

@Injectable({
    providedIn: 'root'
})
export class AuditRepository {
    private readonly endpoint = '/api/v1/audits';
    private readonly http = inject(GenericHttpService);

    list(query: QueryParams = defaultQuery()): Observable<PaginatedResponse<Audit>> {
        return this.http.getAll<Audit>(this.endpoint, query);
    }

    getById(id: string): Observable<Audit> {
        return this.http.getById<Audit>(`${this.endpoint}/${id}`);
    }

    getActionTypes(): Observable<ActionType[]> {
        return this.http.get<ActionType[]>(`${this.endpoint}/actions-types`);
    }
}
