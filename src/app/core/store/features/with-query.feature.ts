// core/store/features/with-query.feature.ts
import { signalStoreFeature, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { computed } from '@angular/core';
import { QueryPatch, QueryParams, mergeQuery } from '../../interfaces/query-params';

// Regla de reset de página: los setters que cambian el CONJUNTO de resultados
// (setSearch, setFilters, setSort, y applyFilters/clearFilters de withFilters)
// resetean Page a 1. `patchQuery` NUNCA la resetea (parches quirúrgicos, ej. URL).

export const DEFAULT_QUERY: QueryParams = {
    search: { SearchText: '', Strict: false },
    filter: [],
    sort: [],
    pag: { Page: 1, PageSize: 5 }
};

export function withQuery() {
    return signalStoreFeature(
        withState({ query: { ...DEFAULT_QUERY } }),
        withComputed(({ query }) => ({
            currentPage: computed(() => query().pag.Page),
            pageSize: computed(() => query().pag.PageSize),
            searchText: computed(() => query().search.SearchText),
            hasActiveFilters: computed(() => {
                const q = query();
                return q.search.SearchText !== '' || q.filter.length > 0;
            })
        })),
        withMethods((store) => ({
            setPage(page: number): void {
                patchState(store, (state) => ({
                    query: { ...state.query, pag: { ...state.query.pag, Page: page } }
                }));
            },
            setPageSize(pageSize: number): void {
                patchState(store, (state) => ({
                    query: { ...state.query, pag: { Page: 1, PageSize: pageSize } }
                }));
            },
            setSearch(text: string): void {
                patchState(store, (state) => ({
                    query: {
                        ...state.query,
                        search: { SearchText: text, Strict: false },
                        pag: { ...state.query.pag, Page: 1 }
                    }
                }));
            },
            setFilters(filters: QueryParams['filter']): void {
                patchState(store, (state) => ({
                    query: {
                        ...state.query,
                        filter: filters,
                        pag: { ...state.query.pag, Page: 1 }
                    }
                }));
            },
            setSort(sort: QueryParams['sort']): void {
                patchState(store, (state) => ({
                    query: {
                        ...state.query,
                        sort,
                        pag: { ...state.query.pag, Page: 1 }
                    }
                }));
            },
            patchQuery(patch: QueryPatch): void {
                patchState(store, (state) => ({
                    query: mergeQuery(state.query, patch)
                }));
            },
            clearQueryParams(): void {
                patchState(store, { query: { ...DEFAULT_QUERY } });
            }
        }))
    );
}
