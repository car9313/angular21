// features/roles/state/role-list.store.ts
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { setAllEntities, withEntities } from '@ngrx/signals/entities';
import { computed, inject } from '@angular/core';
import { EMPTY, Observable, catchError, defer, finalize, switchMap, tap } from 'rxjs';
import { rxMethod } from '@ngrx/signals/rxjs-interop';

import { Role } from '../../domain/role';
import { RoleRepository } from '../../infrastructure/role-repository';
import { QueryParams } from '@/app/core/interfaces/query-params';
import { withQuery } from '@/app/core/store/features/with-query.feature';
import { withListStatus } from '@/app/core/store/features/with-list-status.feature';
import { withModal } from '@/app/core/store/features/with-modal.feature';
import { withSelection } from '@/app/core/store/features/with-selection.feature';
import { withFilters } from '@/app/core/store/features/with-filters.feature';
import { withFiltersPersistence } from '@/app/core/store/features/with-filters-persistence.feature';

export type RoleModalMode = 'add' | 'edit' | 'detail' | 'permissions';

export const RoleListStore = signalStore(
    // ─── Capacidades composicionales ───────────────────────────────────
    withEntities<Role>(),
    withQuery(),
    withListStatus(),
    withFilters(), // ← aplica filtros (usa query)
    withModal<RoleModalMode, Role>(),
    withSelection<number>(),

    // ─── Estado de escritura ───────────────────────────────────────────
    // Separado de `loading`: un guardado nunca debe apagar el skeleton de
    // la tabla, y `error` de withListStatus pertenece al listado, no a un
    // alta/edición/borrado.
    withState({ saving: false }),
    // ─── Persistencia de filtros en sessionStorage ────────────────────
    // Debe ir DESPUÉS de withQuery y withFilters (depende de `query`).
    withFiltersPersistence({
        storageKey: 'roles.list.filters',
        ttlMs: 24 * 60 * 60 * 1000 // 24 horas (opcional)
    }),

    // ─── Derivados específicos de roles ────────────────────────────────
    withComputed(({ ids, entityMap, selectedId }) => ({
        /** ¿El listado está vacío? */
        isEmpty: computed(() => ids().length === 0),

        /** Item seleccionado, resuelto por id vía entityMap (O(1)). */
        selectedItem: computed(() => {
            const id = selectedId();
            return id !== null ? (entityMap()[id] ?? null) : null;
        })
    })),

    // ─── Acciones ──────────────────────────────────────────────────────
    withMethods((store) => {
        const repository = inject(RoleRepository);

        return {
            // ─── Carga reactiva con cancelación ──────────────────────────
            // La query entra por INPUT (no se lee del estado): el llamador
            // decide exactamente qué cargar. switchMap cancela la petición
            // anterior si llega una nueva antes de resolverse.
            load: rxMethod<QueryParams>((query$) =>
                query$.pipe(
                    switchMap((query) => {
                        store._setLoading(true);

                        return repository.list(query).pipe(
                            tap((page) => {
                                patchState(store, setAllEntities(page.objects ?? []));
                                store._setMeta(page.meta);
                                store._setLoading(false);
                            }),
                            catchError((error: unknown) => {
                                patchState(store, setAllEntities<Role>([]));
                                store._setError(error instanceof Error ? error.message : 'No se pudieron cargar los roles.');
                                return EMPTY;
                            })
                        );
                    })
                )
            ),

            // ─── Coordinación: filtros + página + recarga ────────────────
            /**
             * Aplica filtros desde un `FormGroup.value`, resetea la página a 1,
             * y recarga. Es el único método que el componente de filtros necesita.
             */
            applyFiltersAndReload(formValues: Record<string, unknown>): void {
                store.applyFilters(formValues);
                this.load(store.query());
            },

            /**
             * Limpia filtros, resetea la página y recarga.
             */
            clearFiltersAndReload(): void {
                store.clearFilters();
                this.load(store.query());
            },

            // ─── Coordinación: paginación ─────────────────────────────────
            /**
             * Búsqueda libre: patchea `query.search`, resetea la página a 1 y
             * recarga. `withQuery.setSearch` solo muta el estado — sin este
             * coordinador la tabla no se movería (bug silencioso).
             */
            setSearchAndReload(text: string): void {
                store.setSearch(text);
                this.load(store.query());
            },

            setPageAndReload(page: number): void {
                store.setPage(page);
                this.load(store.query());
            },

            setPageSizeAndReload(pageSize: number): void {
                store.setPageSize(pageSize);
                this.load(store.query());
            },

            // ─── Coordinación: modales + selección ────────────────────────
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
            },

            // ─── Escrituras ───────────────────────────────────────────────
            // Devuelven el Observable SIN suscribir: el diálogo decide cuándo
            // disparar y notifica éxito/error. `saving` se apaga en finalize,
            // también si la petición falla. Los errores NO escriben en
            // `error` de withListStatus — eso apagaría el skeleton de la
            // tabla por un alta fallida.
            createAndReload(name: string): Observable<Role> {
                return defer(() => {
                    patchState(store, { saving: true });
                    return repository.create(name);
                }).pipe(
                    tap(() => this.load(store.query())),
                    finalize(() => patchState(store, { saving: false }))
                );
            },

            updateAndReload(id: number, name: string): Observable<Role> {
                return defer(() => {
                    patchState(store, { saving: true });
                    return repository.update(id, name);
                }).pipe(
                    tap(() => this.load(store.query())),
                    finalize(() => patchState(store, { saving: false }))
                );
            },

            deleteAndReload(id: number): Observable<void> {
                return defer(() => {
                    patchState(store, { saving: true });
                    return repository.delete(id);
                }).pipe(
                    tap(() => this.load(store.query())),
                    finalize(() => patchState(store, { saving: false }))
                );
            }
        };
    })
);
