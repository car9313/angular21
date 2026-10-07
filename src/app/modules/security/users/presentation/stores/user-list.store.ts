import { signalStore, withMethods } from '@ngrx/signals';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';

import { User } from '../../domain/user';
import { UserRepository } from '../../infrastructure/user.repository';
import { withServerTable } from '@/app/core/store/features/with-server-table.feature';
import { withServerTableWrites } from '@/app/core/store/features/with-server-table-writes.feature';
import { withFiltersPersistence } from '@/app/core/store/features/with-filters-persistence.feature';
import { withModal } from '@/app/core/store/features/with-modal.feature';

export type UserModalMode = 'add' | 'edit' | 'detail';

export const UserListStore = signalStore(
    // ─── LECTURA de servidor ───────────────────────────────────────────
    withServerTable<User, number>({
        repository: () => inject(UserRepository),
        errorMessage: 'No se pudieron cargar los usuarios.'
    }),

    // ─── ESCRITURA separable ───────────────────────────────────────────
    withServerTableWrites<User, number>({
        repository: () => inject(UserRepository)
    }),

    // ─── Persistencia de filtros en sessionStorage ─────────────────────
    withFiltersPersistence({
        storageKey: 'users.list.filters',
        ttlMs: 24 * 60 * 60 * 1000 // 24 horas
    }),

    // ─── Modal de usuarios (modo de pantalla) ──────────────────────────
    withModal<UserModalMode, User>(),

    // ─── Coordinación: modales + reset password ────────────────────────
    withMethods((store) => {
        const repository = inject(UserRepository);

        return {
            openAdd(): void {
                store.openModal('add', null);
            },

            openEdit(item: User): void {
                store.select(item.id);
                store.openModal('edit', item);
            },

            openDetail(item: User): void {
                store.select(item.id);
                store.openModal('detail', item);
            },

            closeModalAndClearSelection(): void {
                store.closeModal();
                store.clearSelection();
            },

            /**
             * Restablece la contraseña del usuario (POST /{id}/reset-password).
             * Devuelve el Observable SIN suscribir y sin ciclo `saving`/recarga:
             * es un POST breve y la contraseña nunca se muestra en la grilla,
             * así que no hay nada que refrescar (el llamador notifica éxito/error).
             */
            resetPassword(id: number): Observable<void> {
                return repository.resetPassword(id);
            }
        };
    })
);
