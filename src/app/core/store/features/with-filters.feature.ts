// core/store/features/with-filters.feature.ts
import { signalStoreFeature, withComputed, withMethods, patchState, type } from '@ngrx/signals';
import { computed } from '@angular/core';
import { QueryParams } from '../../interfaces/query-params';
import { buildFilters, filtersToObject, hasActiveFilters as hasActiveFiltersUtil } from '../../utils/filters.util';

/** El store debe tener `query` para que esta feature funcione. */
interface FiltersInput {
    query: QueryParams;
}

export function withFilters() {
    return signalStoreFeature(
        { state: type<FiltersInput>() },

        withComputed(({ query }) => ({
            hasActiveFilters: computed(() => hasActiveFiltersUtil(query().filter)),
            filtersAsObject: computed(() => filtersToObject(query().filter))
        })),

        withMethods((store) => ({
            applyFilters(formValues: Record<string, unknown>): void {
                const filters = buildFilters(formValues);
                patchState(store, (state) => ({
                    query: {
                        ...state.query,
                        filter: filters,
                        pag: { ...state.query.pag, Page: 1 }
                    }
                }));
            },

            clearFilters(): void {
                patchState(store, (state) => ({
                    query: {
                        ...state.query,
                        filter: [],
                        search: { SearchText: '', Strict: false },
                        pag: { ...state.query.pag, Page: 1 }
                    }
                }));
            }
        }))
    );
}
