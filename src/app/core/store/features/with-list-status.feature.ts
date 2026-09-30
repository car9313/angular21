// core/store/features/with-list-status.feature.ts
import { signalStoreFeature, withState, withMethods, patchState } from '@ngrx/signals';
import { emptyPaginatedResponse, PaginationMeta } from '../../interfaces/paginated-response';

export const DEFAULT_META: PaginationMeta = emptyPaginatedResponse().meta;

export function withListStatus() {
    return signalStoreFeature(
        withState({
            loading: false,
            error: null as string | null,
            meta: { ...DEFAULT_META }
        }),
        withMethods((store) => ({
            // API pública mínima; el resto lo gestiona el store de la feature
            _setLoading(loading: boolean) {
                patchState(store, { loading, error: loading ? null : store.error() });
            },
            _setError(message: string | null) {
                patchState(store, { error: message, loading: false });
            },
            _setMeta(meta: PaginationMeta) {
                patchState(store, { meta });
            }
        }))
    );
}
