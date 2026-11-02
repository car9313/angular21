import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';

import { UserRepository } from './user.repository';
import { ConfigService } from '@/app/core/services/config.service';
import { defaultQuery } from '@/app/core/interfaces/query-params';
import { User } from '../domain/user';
import { UserCreateDto, UserUpdateDto } from '../domain/user-dtos';

const FAKE_SERVER_API = 'http://test-api';
const USERS_URL = `${FAKE_SERVER_API}/api/users`;

const USER: User = { id: 7, username: 'aruiz', fullName: 'Ana Ruiz', isUnEditable: false, isUnDeletable: false, roles: [] };
const CREATE_DTO: UserCreateDto = { userName: 'aruiz', fullName: 'Ana Ruiz', password: 'Secret1', passwordConfirmation: 'Secret1', roleIds: [1] };
const UPDATE_DTO: UserUpdateDto = { fullName: 'Ana Ruiz', password: null, passwordConfirmation: null, roleIds: [1, 2] };

describe('UserRepository', () => {
    let repository: UserRepository;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: ConfigService, useValue: { urlWith: (sub: string) => `${FAKE_SERVER_API}${sub}` } }
            ]
        });

        repository = TestBed.inject(UserRepository);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('lists through GET /api/users with the pagination params', async () => {
        const done = firstValueFrom(repository.list(defaultQuery()));

        const req = await vi.waitFor(() => httpMock.expectOne((r) => r.url === USERS_URL));
        expect(req.request.method).toBe('GET');
        expect(req.request.params.get('Pag.Page')).toBe('1');

        req.flush({ objects: [USER], meta: { currentPage: 1, nextPage: null, prevPage: null, totalPage: 1, totalCount: 1 } });

        expect((await done).objects).toEqual([USER]);
    });

    it('gets the detail through GET /api/users/{id}', async () => {
        const done = firstValueFrom(repository.getById(7));

        const req = await vi.waitFor(() => httpMock.expectOne(`${USERS_URL}/7`));
        expect(req.request.method).toBe('GET');
        req.flush(USER);

        expect(await done).toEqual(USER);
    });

    it('creates through POST /api/users with the create DTO', async () => {
        const done = firstValueFrom(repository.create(CREATE_DTO));

        const req = await vi.waitFor(() => httpMock.expectOne(USERS_URL));
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(CREATE_DTO);
        req.flush(USER);

        expect(await done).toEqual(USER);
    });

    it('updates through PUT /api/users/{id} with the update DTO', async () => {
        const done = firstValueFrom(repository.update(7, UPDATE_DTO));

        const req = await vi.waitFor(() => httpMock.expectOne(`${USERS_URL}/7`));
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual(UPDATE_DTO);
        req.flush(USER);

        expect(await done).toEqual(USER);
    });

    it('deletes through DELETE /api/users/{id}', async () => {
        const done = firstValueFrom(repository.delete(7));

        const req = await vi.waitFor(() => httpMock.expectOne(`${USERS_URL}/7`));
        expect(req.request.method).toBe('DELETE');
        req.flush(null);

        expect(await done).toBeNull();
    });

    it('resets the password through POST /api/users/{id}/reset-password with a null body', async () => {
        const done = firstValueFrom(repository.resetPassword(7));

        const req = await vi.waitFor(() => httpMock.expectOne(`${USERS_URL}/7/reset-password`));
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toBeNull();
        req.flush(null);

        expect(await done).toBeNull();
    });
});
