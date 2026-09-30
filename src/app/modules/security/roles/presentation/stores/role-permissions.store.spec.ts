import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Observable, throwError } from 'rxjs';
import type { TreeNode } from 'primeng/api';

import { RolePermissionsStore } from './role-permissions.store';
import { RoleRepository } from '../../infrastructure/role-repository';
import { AppPermissionsCategory } from '../../domain/role';

const catalog: AppPermissionsCategory[] = [
    { category: 'Usuarios', permissions: [{ resource: 'users', description: 'Usuarios', actions: ['Leer', 'Crear'] }] }
];

const rolePermissions: AppPermissionsCategory[] = [
    { category: 'Usuarios', permissions: [{ resource: 'users', description: 'Usuarios', actions: ['Leer'] }] }
];

const selectedNodes: TreeNode[] = [
    { key: 'Usuarios_users_Leer', data: { resource: 'users', actionType: 'Leer' } },
    { key: 'Usuarios_users_Crear', data: { resource: 'users', actionType: 'Crear' } },
    // Nodo intermedio REAL: trae children poblado (no es una hoja) → debe descartarse
    {
        key: 'Usuarios_users',
        data: { resource: 'users' },
        children: [{ key: 'Usuarios_users_Leer', label: 'Leer' }]
    }
];

/** Observable que resuelve en un microtask: permite asertar el estado "en vuelo". */
function asyncValue<T>(value: T): Observable<T> {
    return new Observable((subscriber) => {
        queueMicrotask(() => {
            subscriber.next(value);
            subscriber.complete();
        });
    });
}

async function settle(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
}

describe('RolePermissionsStore', () => {
    let repository: {
        getPermissionsCatalog: ReturnType<typeof vi.fn>;
        getPermissionsByRole: ReturnType<typeof vi.fn>;
        updatePermissions: ReturnType<typeof vi.fn>;
    };
    let store: InstanceType<typeof RolePermissionsStore>;

    beforeEach(() => {
        repository = {
            getPermissionsCatalog: vi.fn(() => asyncValue(catalog)),
            getPermissionsByRole: vi.fn(() => asyncValue(rolePermissions)),
            updatePermissions: vi.fn(() => asyncValue(undefined))
        };

        TestBed.configureTestingModule({
            providers: [{ provide: RoleRepository, useValue: repository }]
        });

        store = TestBed.runInInjectionContext(() => new RolePermissionsStore());
    });

    it('starts empty and idle', () => {
        expect(store.roleId()).toBeNull();
        expect(store.catalog()).toEqual([]);
        expect(store.assignedKeys()).toEqual([]);
        expect(store.loading()).toBe(false);
        expect(store.saving()).toBe(false);
        expect(store.error()).toBeNull();
    });

    it('loads catalog and role permissions in parallel and derives assigned keys', async () => {
        store.load(7);

        expect(store.loading()).toBe(true);
        // Ambas peticiones se lanzan en paralelo (forkJoin) — sin secuencia.
        expect(repository.getPermissionsCatalog).toHaveBeenCalledTimes(1);
        expect(repository.getPermissionsByRole).toHaveBeenCalledWith(7);

        await settle();

        expect(store.loading()).toBe(false);
        expect(store.roleId()).toBe(7);
        expect(store.catalog()).toEqual(catalog);
        expect(store.assignedKeys()).toEqual(['Usuarios_users_Leer']);
        expect(store.error()).toBeNull();
    });

    it('exposes error and stops loading when the fetch fails', async () => {
        repository.getPermissionsCatalog.mockReturnValue(throwError(() => new Error('red timeout')));

        store.load(7);
        await settle();

        expect(store.loading()).toBe(false);
        expect(store.error()).toBe('red timeout');
        expect(store.catalog()).toEqual([]);
    });

    it('saves only leaf payloads via the repository and clears saving on done', async () => {
        repository.updatePermissions.mockReturnValue(
            new Observable<void>((subscriber) => {
                // Estado observable en vuelo: saving debe estar activo al emitir.
                expect(store.saving()).toBe(true);
                queueMicrotask(() => {
                    subscriber.next(undefined);
                    subscriber.complete();
                });
            })
        );

        store.load(7);
        await settle();

        const result$ = store.save(selectedNodes);
        const done = new Promise<void>((resolve) => result$.subscribe({ complete: () => resolve() }));
        await done;

        expect(repository.updatePermissions).toHaveBeenCalledWith(7, [
            { resource: 'users', actionType: 'Leer' },
            { resource: 'users', actionType: 'Crear' }
        ]);
        expect(store.saving()).toBe(false);
    });

    it('clears saving also when the save fails', async () => {
        repository.updatePermissions.mockReturnValue(
            new Observable<void>((subscriber) => {
                expect(store.saving()).toBe(true);
                queueMicrotask(() => subscriber.error(new Error('network down')));
            })
        );

        store.load(7);
        await settle();

        const result$ = store.save(selectedNodes);
        await new Promise<void>((resolve) => result$.subscribe({ error: () => resolve() }));
        expect(store.saving()).toBe(false);
    });

    it('refuses to save without a prior load', () => {
        expect(() => store.save(selectedNodes)).toThrow(/requires a prior load/);
    });
});