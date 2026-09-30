// core/store/features/with-modal.feature.ts
import { signalStoreFeature, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { computed } from '@angular/core';

export function withModal<Mode extends string, Item>() {
    return signalStoreFeature(
        withState({
            modalMode: null as Mode | null,
            modalItem: null as Item | null
        }),
        withComputed(({ modalMode }) => ({
            isModalOpen: computed(() => modalMode() !== null)
        })),
        withMethods((store) => ({
            openModal(mode: Mode, item: Item | null = null): void {
                patchState(store, { modalMode: mode, modalItem: item });
            },
            closeModal(): void {
                patchState(store, { modalMode: null, modalItem: null });
            }
        }))
    );
}
