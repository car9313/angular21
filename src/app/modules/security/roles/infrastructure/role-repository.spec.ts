import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';

import { RoleRepository } from './role-repository';
import { ConfigService } from '@/app/core/services/config.service';
import { defaultQuery } from '@/app/core/interfaces/query-params';
import { AppPermissionsCategory, Role } from '../domain/role';

const FAKE_SERVER_API = 'http://test-api';
const ROLES_URL = `${FAKE_SERVER_API}/api/roles`;

const ROLE: Role = { id: 3, name: 'Administrador', isUnEditable: false, isUnDeletable: false, permissions: [] };
const CATALOG: AppPermissionsCategory[] = [{ category: 'Nomencladores', permissions: [{ resource: 'Nomenclators', description: 'Nomencladores', actions: ['Read'] }] }];

describe('RoleRepository', () => {
    let repository: RoleRepository;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: ConfigService, useValue: { urlWith: (sub: string) => `${FAKE_SERVER_API}${sub}` } }
            ]
        });

        repository = TestBed.inject(RoleRepository);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('lists through GET /api/roles with the pagination params', async () => {
        const done = firstValueFrom(repository.list(defaultQuery()));

        const req = await vi.waitFor(() => httpMock.expectOne((r) => r.url === ROLES_URL));
        expect(req.request.method).toBe('GET');
        expect(req.request.params.get('Pag.PageSize')).toBe('5');

        req.flush({ objects: [ROLE], meta: { currentPage: 1, nextPage: null, prevPage: null, totalPage: 1, totalCount: 1 } });

        expect((await done).objects).toEqual([ROLE]);
    });

    it('gets the detail through GET /api/roles/{id}', async () => {
        const done = firstValueFrom(repository.getById(3));

        const req = await vi.waitFor(() => httpMock.expectOne(`${ROLES_URL}/3`));
        expect(req.request.method).toBe('GET');
        req.flush(ROLE);

        expect(await done).toEqual(ROLE);
    });

    it('loads the permissions catalog from GET /api/roles/permissions', async () => {
        const done = firstValueFrom(repository.getPermissionsCatalog());

        const req = await vi.waitFor(() => httpMock.expectOne(`${ROLES_URL}/permissions`));
        expect(req.request.method).toBe('GET');
        req.flush(CATALOG);

        expect(await done).toEqual(CATALOG);
    });

    it('loads the permissions of a role from GET /api/roles/{id}/permissions', async () => {
        const done = firstValueFrom(repository.getPermissionsByRole(3));

        const req = await vi.waitFor(() => httpMock.expectOne(`${ROLES_URL}/3/permissions`));
        expect(req.request.method).toBe('GET');
        req.flush(CATALOG);

        expect(await done).toEqual(CATALOG);
    });

    it('creates through POST /api/roles with the name', async () => {
        const done = firstValueFrom(repository.create('Administrador'));

        const req = await vi.waitFor(() => httpMock.expectOne(ROLES_URL));
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ name: 'Administrador' });
        req.flush(ROLE);

        expect(await done).toEqual(ROLE);
    });

    it('updates the name through PUT /api/roles/{id}', async () => {
        const done = firstValueFrom(repository.update(3, 'Administrador'));

        const req = await vi.waitFor(() => httpMock.expectOne(`${ROLES_URL}/3`));
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual({ name: 'Administrador' });
        req.flush(ROLE);

        expect(await done).toEqual(ROLE);
    });

    it('updates the permissions through PUT /api/roles/{id}/permissions', async () => {
        const actions = [{ resource: 'Nomenclators', actionType: 'Read' }];
        const done = firstValueFrom(repository.updatePermissions(3, actions));

        const req = await vi.waitFor(() => httpMock.expectOne(`${ROLES_URL}/3/permissions`));
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual(actions);
        req.flush(null);

        expect(await done).toBeNull();
    });

    it('deletes through DELETE /api/roles/{id}', async () => {
        const done = firstValueFrom(repository.delete(3));

        const req = await vi.waitFor(() => httpMock.expectOne(`${ROLES_URL}/3`));
        expect(req.request.method).toBe('DELETE');
        req.flush(null);

        expect(await done).toBeNull();
    });
});
