// core/store/features/with-server-table.feature.ts
import { signalStoreFeature, withComputed, withMethods, patchState } from '@ngrx/signals';
import { setAllEntities, withEntities } from '@ngrx/signals/entities';
import { computed } from '@angular/core';
import { EMPTY, Observable, catchError, switchMap, tap } from 'rxjs';
import { rxMethod } from '@ngrx/signals/rxjs-interop';

import { QueryParams } from '../../interfaces/query-params';
import { PaginatedResponse } from '../../interfaces/paginated-response';
import { withQuery } from './with-query.feature';
import { withListStatus } from './with-list-status.feature';
import { withFilters } from './with-filters.feature';
import { withSelection } from './with-selection.feature';

/**
 * Repositorio mínimo que una grilla de servidor necesita para leer.
 * Quien tenga más operaciones (getById, etc.) las declara en su feature de
 * dominio; aquí solo vive el listado paginado que `load` consume.
 */
export interface ServerTableRepository<E> {
    list(query: QueryParams): Observable<PaginatedResponse<E>>;
}

export interface WithServerTableConfig<E> {
    /** Fábrica del repositorio (para poder `inject()` dentro del store). */
    repository: () => ServerTableRepository<E>;
    /** Mensaje usado cuando el error no es un `Error` con `.message`. */
    errorMessage?: string;
}

export const DEFAULT_TABLE_ERROR = 'No se pudieron cargar los datos.';

/**
 * Feature de LECTURA para una grilla de servidor: la base reutilizable de
 * cualquier pantalla de listado (lea o escriba).
 *
 * Compone `withEntities`, `withQuery`, `withListStatus`, `withFilters` y
 * `withSelection`, y aporta:
 * - `load = rxMethod<QueryParams>` con `switchMap` (cancela requests en
 *   flight → stale responses nunca pisan el estado de la última query).
 * - Coordinadores de recarga (`applyFiltersAndReload`, `clearFiltersAndReload`,
 *   `setSearchAndReload`, `setPageAndReload`, `setPageSizeAndReload`, `reload`).
 * - Computed `isEmpty` y `selectedItem`.
 *
 * NO incluye escrituras ni `saving`: eso lo aporta `withServerTableWrites`
 * (solo pantallas CRUD).
 */
export function withServerTable<E extends { id: Id }, Id extends string | number>(config: WithServerTableConfig<E>) {
    const { repository, errorMessage = DEFAULT_TABLE_ERROR } = config;

    return signalStoreFeature(
        withEntities<E>(),
        withQuery(),
        withListStatus(),
        withFilters(),
        withSelection<Id>(),

        withComputed(({ ids, entityMap, selectedId }) => ({
            isEmpty: computed(() => ids().length === 0),
            selectedItem: computed(() => {
                const id = selectedId();
                return id !== null ? (entityMap()[id] ?? null) : null;
            })
        })),

        withMethods((store) => {
            const repo = repository();

            return {
                load: rxMethod<QueryParams>((query$) =>
                    query$.pipe(
                        switchMap((query) => {
                            store._setLoading(true);
                            return repo.list(query).pipe(
                                tap((page) => {
                                    patchState(store, setAllEntities(page.objects ?? []));
                                    store._setMeta(page.meta);
                                    store._setLoading(false);
                                }),
                                catchError((error: unknown) => {
                                    patchState(store, setAllEntities<E>([]));
                                    store._setError(error instanceof Error ? error.message : errorMessage);
                                    return EMPTY;
                                })
                            );
                        })
                    )
                ),

                /** Recarga la query actual. */
                reload(): void {
                    this.load(store.query());
                },

                // ─── Coordinadores de lectura ───────────────────────────────
                applyFiltersAndReload(formValues: Record<string, unknown>): void {
                    store.applyFilters(formValues);
                    this.load(store.query());
                },

                clearFiltersAndReload(): void {
                    store.clearFilters();
                    this.load(store.query());
                },

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
                }
            };
        })
    );
}
