// core/store/features/with-server-table.feature.ts
import { signalStoreFeature, withComputed, withMethods, patchState } from '@ngrx/signals';
import { setAllEntities, withEntities, type EntityId, type SelectEntityId } from '@ngrx/signals/entities';
import { computed } from '@angular/core';
import { EMPTY, Observable, catchError, switchMap, tap } from 'rxjs';
import { rxMethod } from '@ngrx/signals/rxjs-interop';

import { QueryParams, type QueryPatch } from '../../interfaces/query-params';
import { PaginatedResponse } from '../../interfaces/paginated-response';
import { withQuery } from './with-query.feature';
import { withListStatus } from './with-list-status.feature';
import { withFilters } from './with-filters.feature';
import { withSelection } from './with-selection.feature';

export interface ServerTableRepository<E> {
    list(query: QueryParams): Observable<PaginatedResponse<E>>;
}

// ─── selectId ────────────────────────────────────────────────────────────────
type EntityIdKey<E> = {
    [K in keyof E]: E[K] extends EntityId ? K : never;
}[keyof E];

type SelectId<E> = SelectEntityId<E> | EntityIdKey<E>;

export interface WithServerTableConfig<E extends object> {
    repository: () => ServerTableRepository<E>;
    errorMessage?: string;
    /** nombre de campo o función. Default: `e.id` si E lo tiene. */
    selectId: SelectId<E>;
}

export const DEFAULT_TABLE_ERROR = 'No se pudieron cargar los datos.';

export function withServerTable<E extends object, Id extends EntityId = EntityId>(config: WithServerTableConfig<E>) {
    const { repository, errorMessage = DEFAULT_TABLE_ERROR } = config;

    // string | función → SelectEntityId<E>
    const selectId: SelectEntityId<E> = typeof config.selectId === 'function' ? config.selectId : config.selectId ? (e) => e[config.selectId as EntityIdKey<E>] as EntityId : (e) => (e as { id: EntityId }).id;

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
            const load = rxMethod<void>((trigger$) =>
                trigger$.pipe(
                    switchMap(() => {
                        store._setLoading(true);
                        return repo.list(store.query()).pipe(
                            tap((page) => {
                                patchState(store, setAllEntities(page.objects ?? [], { selectId }));
                                store._setMeta(page.meta);
                                store._setLoading(false);
                            }),
                            catchError((error: unknown) => {
                                patchState(store, setAllEntities<E>([], { selectId }));
                                store._setError(error instanceof Error ? error.message : errorMessage);
                                return EMPTY;
                            })
                        );
                    })
                )
            );

            return {
                load: () => load(),

                applyFiltersAndReload(formValues: Record<string, unknown>): void {
                    store.applyFilters(formValues);
                    load();
                },
                clearFiltersAndReload(): void {
                    store.clearFilters();
                    load();
                },
                setSearchAndReload(text: string): void {
                    store.setSearch(text);
                    load();
                },
                setPageAndReload(page: number): void {
                    store.setPage(page);
                    load();
                },
                setPageSizeAndReload(pageSize: number): void {
                    store.setPageSize(pageSize);
                    load();
                },
                setSortAndReload(sort: QueryParams['sort']): void {
                    store.setSort(sort);
                    load();
                },
                applyQueryAndReload(patch: QueryPatch): void {
                    store.patchQuery(patch);
                    load();
                }
            };
        })
    );
}
