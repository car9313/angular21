// features/roles/state/role-list.store.ts
import { signalStore, withMethods } from '@ngrx/signals';
import { inject } from '@angular/core';

import { Role } from '../../domain/role';
import { RoleRepository } from '../../infrastructure/role-repository';
import { withServerTable } from '@/app/core/store/features/with-server-table.feature';
import { withServerTableWrites } from '@/app/core/store/features/with-server-table-writes.feature';
import { withFiltersPersistence } from '@/app/core/store/features/with-filters-persistence.feature';
import { withModal } from '@/app/core/store/features/with-modal.feature';

export type RoleModalMode = 'add' | 'edit' | 'detail' | 'permissions';

export const RoleListStore = signalStore(
    // ─── LECTURA de servidor ───────────────────────────────────────────
    // query + entidades + loading/meta + stale responses (switchMap) +
    // selección + coordinadores de recarga. Sin escrituras ni `saving`.
    withServerTable<Role, number>({
        repository: () => inject(RoleRepository),
        errorMessage: 'No se pudieron cargar los roles.'
    }),

    // ─── ESCRITURA separable ───────────────────────────────────────────
    // `saving` + create/update/deleteAndReload: recarga la query actual al
    // resolver. `saving` es independiente de `loading` (nunca apaga el
    // skeleton de la tabla) y los errores de escritura NO escriben en
    // `error` de withListStatus.
    withServerTableWrites<Role, number>({
        repository: () => inject(RoleRepository)
    }),

    // ─── Persistencia de filtros en sessionStorage ─────────────────────
    // Depende de `query` → compuesta DESPUÉS de la feature de lectura.
    withFiltersPersistence({
        storageKey: 'roles.list.filters',
        ttlMs: 24 * 60 * 60 * 1000 // 24 horas
    }),

    // ─── Modal de roles (modo de pantalla) ─────────────────────────────
    withModal<RoleModalMode, Role>(),

    // ─── Coordinación: modales + selección ─────────────────────────────
    withMethods((store) => ({
        openAdd(): void {
            store.openModal('add', null);
        },

        openEdit(item: Role): void {
            store.select(item.id);
            store.openModal('edit', item);
        },

        openDetail(item: Role): void {
            store.select(item.id);
            store.openModal('detail', item);
        },

        openPermissions(item: Role): void {
            store.select(item.id);
            store.openModal('permissions', item);
        },

        closeModalAndClearSelection(): void {
            store.closeModal();
            store.clearSelection();
        }
    }))
);
