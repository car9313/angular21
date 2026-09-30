// core/store/features/with-selection.feature.ts
import { signalStoreFeature, withState, withMethods, patchState } from '@ngrx/signals';

export function withSelection<Id extends string | number>() {
    return signalStoreFeature(
        withState({ selectedId: null as Id | null }),
        withMethods((store) => ({
            select(id: Id | null): void {
                patchState(store, { selectedId: id });
            },
            clearSelection(): void {
                patchState(store, { selectedId: null });
            }
        }))
    );
}
