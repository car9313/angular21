// src/app/modules/security/roles/presentation/stores/role-permissions.store.ts
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { EMPTY, Observable, catchError, defer, finalize, forkJoin, tap } from 'rxjs';
import type { TreeNode } from 'primeng/api';

import { RoleRepository } from '../../infrastructure/role-repository';
import { AppPermissionsCategory } from '../../domain/role';
import { PermissionsTreeMapperService } from '@/app/shared/components/permissions-tree/services/permissions-tree-mapper.service';

interface RolePermissionsState {
    /** Rol en edición (lo fija `load`). */
    roleId: number | null;
    /** Catálogo completo de permisos (shape del backend). */
    catalog: AppPermissionsCategory[];
    /** Claves de las hojas ya asignadas al rol (a partir de sus permisos). */
    assignedKeys: string[];
    /** Carga inicial del diálogo (catálogo + permisos del rol). */
    loading: boolean;
    /** Guardado en curso; deshabilita acciones del diálogo. */
    saving: boolean;
    error: string | null;
}

const initialState: RolePermissionsState = {
    roleId: null,
    catalog: [],
    assignedKeys: [],
    loading: false,
    saving: false,
    error: null
};

/**
 * Feature store del diálogo de permisos por rol.
 *
 * Es un store DEDICADO a propósito: el listado (`RoleListStore`) no debe cargar
 * con un segundo ciclo de vida (catálogo + permisos + guardado) que solo le
 * interesa a un modal. Este store vive en el proveedor del diálogo y muere con él.
 *
 * Responsabilidades:
 * - `load(roleId)`: catálogo + permisos del rol en PARALELO (forkJoin) y reemplaza
 *   el set completo a editar. Si la carga falla, expone `error` y deja de cargar.
 * - `save(selectedNodes)`: arma el payload desde las hojas con `data` estructurado
 *   (sin parsear claves) y devuelve un Observable SIN suscribir; el diálogo decide
 *   cuándo disparar y qué notificar. `saving` se apaga en finalize, también al fallar.
 */
export const RolePermissionsStore = signalStore(
    withState(initialState),
    withMethods((store) => {
        const repository = inject(RoleRepository);
        const mapper = inject(PermissionsTreeMapperService);

        return {
            load(roleId: number): void {
                patchState(store, { roleId, loading: true, error: null });

                forkJoin({
                    catalog: repository.getPermissionsCatalog(),
                    rolePermissions: repository.getPermissionsByRole(roleId)
                }).pipe(
                    tap(({ catalog, rolePermissions }) => {
                        patchState(store, {
                            catalog,
                            assignedKeys: mapper.collectAssignedKeys(rolePermissions),
                            loading: false
                        });
                    }),
                    catchError((error: unknown) => {
                        patchState(store, {
                            loading: false,
                            error: error instanceof Error ? error.message : 'No se pudieron cargar los permisos.'
                        });
                        return EMPTY;
                    })
                ).subscribe();
            },

            save(selectedNodes: TreeNode[]): Observable<void> {
                const roleId = store.roleId();
                if (roleId === null) {
                    throw new Error('RolePermissionsStore#save requires a prior load(roleId).');
                }

                const payload = mapper.leavesToPayload(selectedNodes);

                return defer(() => {
                    patchState(store, { saving: true });
                    return repository.updatePermissions(roleId, payload);
                }).pipe(finalize(() => patchState(store, { saving: false })));
            }
        };
    })
);