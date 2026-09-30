import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericHttpService } from '../../../../core/services/generic-http.service';
import { QueryParams, defaultQuery } from '../../../../core/interfaces/query-params';
import { PaginatedResponse } from '../../../../core/interfaces/paginated-response';
import { Role, AppPermissionsCategory } from '../domain/role';

@Injectable({ providedIn: 'root' })
export class RoleRepository {
    private readonly http = inject(GenericHttpService);
    private readonly endpoint = '/api/roles';

    list(query: QueryParams = defaultQuery()): Observable<PaginatedResponse<Role>> {
        return this.http.getAll<Role>(this.endpoint, query);
    }

    getById(id: number): Observable<Role> {
        return this.http.getById<Role>(`${this.endpoint}/${id}`);
    }

    getPermissionsCatalog(): Observable<AppPermissionsCategory[]> {
        return this.http.getArray<AppPermissionsCategory>(`${this.endpoint}/permissions`);
    }

    getPermissionsByRole(roleId: number): Observable<AppPermissionsCategory[]> {
        return this.http.getArray<AppPermissionsCategory>(`${this.endpoint}/${roleId}/permissions`);
    }

    create(name: string): Observable<Role> {
        return this.http.create<Role>(this.endpoint, { name });
    }

    update(id: number, name: string): Observable<Role> {
        return this.http.update<Role>(`${this.endpoint}/${id}`, { name });
    }

    updatePermissions(roleId: number, actions: { resource: string; actionType: string }[]): Observable<void> {
        return this.http.update<void>(`${this.endpoint}/${roleId}/permissions`, actions);
    }

    delete(id: number): Observable<void> {
        return this.http.delete(`${this.endpoint}/${id}`);
    }
}
