import { Injectable, inject } from '@angular/core';
import { GenericHttpService } from '../../../../core/services/generic-http.service';
import { QueryParams, defaultQuery } from '../../../../core/interfaces/query-params';
import { PaginatedResponse } from '../../../../core/interfaces/paginated-response';
import { Role, AppPermissionsCategory } from '../domain/role';

/**
 * Roles HTTP endpoints. Promise-based (project convention) so use-cases read
 * linearly. Knows the .NET pagination contract through GenericHttpService.
 *
 * Endpoint map (verified against RoleController 2026-09-23):
 * - GET    /api/roles              → FilterResponse<RoleDto> (paginated)
 * - GET    /api/roles/{id}         → RoleDto
 * - GET    /api/roles/permissions  → AppPermissionsCategory[] (global catalog)
 * - GET    /api/roles/{id}/permissions → AppPermissionsCategory[] (assigned)
 * - POST   /api/roles              → RoleDto (create)
 * - PUT    /api/roles/{id}         → RoleDto (rename)
 * - PUT    /api/roles/{id}/permissions → ActionCommand[] (assign)
 * - DELETE /api/roles/{id}
 */
@Injectable({ providedIn: 'root' })
export class RoleRepository {
    private readonly http = inject(GenericHttpService);

    private readonly endpoint = '/api/roles';

    list(query: QueryParams = defaultQuery()): Promise<PaginatedResponse<Role>> {
        return this.http.getAll<Role>(this.endpoint, query);
    }

    getById(id: number): Promise<Role> {
        return this.http.getById<Role>(`${this.endpoint}/${id}`);
    }

    getPermissionsCatalog(): Promise<AppPermissionsCategory[]> {
        return this.http.getArray<AppPermissionsCategory>(`${this.endpoint}/permissions`);
    }

    getPermissionsByRole(roleId: number): Promise<AppPermissionsCategory[]> {
        return this.http.getArray<AppPermissionsCategory>(`${this.endpoint}/${roleId}/permissions`);
    }

    create(name: string): Promise<Role> {
        return this.http.create<Role>(this.endpoint, { name });
    }

    update(id: number, name: string): Promise<Role> {
        return this.http.update<Role>(`${this.endpoint}/${id}`, { name });
    }

    /** Assigns the FULL permission list (no diff is sent; matches the API). */
    updatePermissions(roleId: number, actions: { resource: string; actionType: string }[]): Promise<void> {
        return this.http.update<void>(`${this.endpoint}/${roleId}/permissions`, actions);
    }

    delete(id: number): Promise<void> {
        return this.http.delete(`${this.endpoint}/${id}`);
    }
}