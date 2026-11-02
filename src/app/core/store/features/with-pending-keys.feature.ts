import { signalStoreFeature, withComputed, withMethods, withState, patchState } from '@ngrx/signals';
import { computed } from '@angular/core';
import { Observable, defer, finalize } from 'rxjs';

/** Marca claves "en proceso" (toggles, borrados por fila...) con cleanup garantizado. */
export function withPendingKeys<K extends string | number>() {
    return signalStoreFeature(
        withState({ pendingKeys: [] as K[] }),
        withComputed(({ pendingKeys }) => ({
            pendingSet: computed<ReadonlySet<K>>(() => new Set(pendingKeys()))
        })),
        withMethods((store) => ({
            isPending: (key: K) => store.pendingSet().has(key),

            /** Operador: marca al suscribirse, desmarca al terminar/fallar/cancelar. */
            trackPending:
                <T>(key: K) =>
                (source: Observable<T>) =>
                    defer(() => {
                        patchState(store, (s) => ({ pendingKeys: [...s.pendingKeys, key] }));
                        return source.pipe(finalize(() => patchState(store, (s) => ({ pendingKeys: s.pendingKeys.filter((k) => k !== key) }))));
                    })
        }))
    );
}
