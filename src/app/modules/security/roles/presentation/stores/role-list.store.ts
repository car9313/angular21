import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { setAllEntities, withEntities } from '@ngrx/signals/entities';
import { computed, inject } from '@angular/core';
import { EMPTY, Observable, catchError, from, switchMap } from 'rxjs';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { QueryParams, defaultQuery } from '../../../../../core/interfaces/query-params';
import { Role } from '../../domain/role';
import { RoleRepository } from '../../infrastructure/role-repository';

/** Plain scalars of the screen store (entities live in withEntities). */
interface RoleListState {
    query: QueryParams;
    total: number;
    loading: boolean;
    /** User-facing error message, null while idle/success. */
    error: string | null;
}

const roleListInitialState: RoleListState = {
    query: defaultQuery(),
    total: 0,
    loading: false,
    error: null
};

/**
 * Roles screen store (list view).
 *
 * - Entities: withEntities → O(1) lookup by id (entityMap), ordered ids array
 *   and CRUD helpers (addEntity/updateEntity/removeEntity) for the next steps.
 * - Derived state: wrapped in computed() → memoized + reactive signals.
 * - IO: rxMethod with switchMap — the reactive method pushes each call into a
 *   shared Subject and switchMap UNSUBSCRIBES the previous in-flight fetch,
 *   so a stale response can never overwrite a newer result (search race).
 * - Not providedIn:'root': the page provides the store so state dies with the
 *   route — no cross-screen leakage.
 */
export const RoleListStore = signalStore(
    withState<RoleListState>(roleListInitialState),
    withEntities<Role>(),
    withComputed(({ ids }) => ({
        /** Derived boolean - computed() so Angular re-evaluates on change. */
        isEmpty: computed(() => ids().length === 0)
    })),
    withMethods((store) => {
        const repository = inject(RoleRepository);

        return {
            /**
             * Reactive fetch: rxMethod. Every call hits the internal Subject;
             * switchMap cancels the previous in-flight request. Fire-and-forget
             * from the caller's perspective: subscribe/(no await) required.
             */
            load: rxMethod((source$: Observable<QueryParams>): Observable<unknown> =>
                source$.pipe(
                    switchMap((query) => {
                        patchState(store, { query, loading: true, error: null });

                        return from(repository.list(query)).pipe(
                            switchMap((page) => {
                                patchState(store, setAllEntities(page.objects ?? []));
                                patchState(store, { total: page.meta?.totalCount ?? 0, loading: false, error: null });
                                return EMPTY;
                            }),
                            catchError((error: unknown) => {
                                patchState(store, setAllEntities<Role>([]));
                                patchState(store, {
                                    loading: false,
                                    error: error instanceof Error ? error.message : 'No se pudieron cargar los roles.'
                                });
                                return EMPTY;
                            })
                        );
                    })
                )
            )
        };
    })
);