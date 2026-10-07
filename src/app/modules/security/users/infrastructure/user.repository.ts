import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericHttpService } from '../../../../core/services/generic-http.service';
import { QueryParams, defaultQuery } from '../../../../core/interfaces/query-params';
import { PaginatedResponse } from '../../../../core/interfaces/paginated-response';
import { User } from '../domain/user';
import { UserCreateDto, UserUpdateDto } from '../domain/user-dtos';

@Injectable({ providedIn: 'root' })
export class UserRepository {
    private readonly http = inject(GenericHttpService);
    private readonly endpoint = '/api/users';

    list(query: QueryParams = defaultQuery()): Observable<PaginatedResponse<User>> {
        return this.http.getAll<User>(this.endpoint, query);
    }

    getById(id: number): Observable<User> {
        return this.http.getById<User>(`${this.endpoint}/${id}`);
    }

    create(dto: UserCreateDto): Observable<User> {
        return this.http.create<User>(this.endpoint, dto);
    }

    update(id: number, dto: UserUpdateDto): Observable<User> {
        return this.http.update<User>(`${this.endpoint}/${id}`, dto);
    }

    delete(id: number): Observable<void> {
        return this.http.delete(`${this.endpoint}/${id}`);
    }

    /** POST /{id}/reset-password (body null): el backend devuelve la clave temporal. */
    resetPassword(id: number): Observable<void> {
        return this.http.create<void>(`${this.endpoint}/${id}/reset-password`, null);
    }
}
