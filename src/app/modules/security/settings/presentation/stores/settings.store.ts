// src/app/modules/security/settings/presentation/stores/settings.store.ts
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { EMPTY, Observable, catchError, defer, finalize, tap } from 'rxjs';

import { SecuritySettings } from '../../domain/security-settings';
import { SettingsRepository } from '../../infrastructure/settings-repository';

interface SettingsState {
    /** Loaded settings (null until the first GET resolves). */
    current: SecuritySettings | null;
    /** GET in flight (drives the progress spinner of the detail). */
    loading: boolean;
    /** Save in flight (drives the Guardar button of the dialog). */
    saving: boolean;
    /** Load error message (null on success). */
    error: string | null;
}

const initialState: SettingsState = {
    current: null,
    loading: false,
    saving: false,
    error: null
};

/**
 * ROOT-SCOPED singleton store for the global security settings.
 *
 * `providedIn: 'root'` is deliberate: a future consumer (e.g. an inactivity /
 * session-expiry watch) must read the SAME instance without re-working DI
 * ownership. The settings page never lists this store in providers — it is a
 * singleton, not a per-page entity.
 *
 * - `load()`: one-shot GET that patches `current`/`error` and drives `loading`.
 * - `save(entity)`: returns an Observable WITHOUT subscribing; `saving` is
 *   patched in `defer` and cleared in `finalize`, so it also clears on failure.
 */
export const SettingsStore = signalStore(
    { providedIn: 'root' },
    withState(initialState),
    withMethods((store) => {
        const repository = inject(SettingsRepository);

        return {
            load(): void {
                patchState(store, { loading: true, error: null });

                repository.get().pipe(
                    tap((settings) => patchState(store, { current: settings, loading: false })),
                    catchError((error: unknown) => {
                        patchState(store, {
                            loading: false,
                            error: error instanceof Error ? error.message : 'No se pudieron cargar los ajustes de seguridad.'
                        });
                        return EMPTY;
                    })
                ).subscribe();
            },

            save(entity: SecuritySettings): Observable<SecuritySettings> {
                return defer(() => {
                    patchState(store, { saving: true });
                    return repository.save(entity);
                }).pipe(
                    tap((saved) => patchState(store, { current: saved, error: null })),
                    finalize(() => patchState(store, { saving: false }))
                );
            }
        };
    })
);