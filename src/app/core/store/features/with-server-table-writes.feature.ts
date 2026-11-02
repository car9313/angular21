// core/store/features/with-server-table-writes.feature.ts
import { signalStoreFeature, type, withMethods, withState, patchState } from '@ngrx/signals';
import { type EntityId } from '@ngrx/signals/entities';
import { Observable, defer, finalize, tap } from 'rxjs';

/**
 * Acciones de escritura mínimas que una pantalla CRUD necesita.
 * Los argumentos concretos los aporta cada store/dominio al envolver estos
 * métodos, no esta feature.
 */
export interface ServerTableWriteActions<E, Id> {
    create?(...args: unknown[]): Observable<E>;
    update?(id: Id, ...args: unknown[]): Observable<E>;
    delete?(id: Id): Observable<unknown>;
}

export interface WithServerTableWritesConfig<E, Id> {
    /** Fábrica del repositorio (para poder `inject()` dentro del store). */
    repository: () => ServerTableWriteActions<E, Id>;
}

/**
 * Feature de ESCRITURA separable para grillas de servidor.
 *
 * Compónela SOLO en pantallas CRUD; una pantalla read-only nunca la compone.
 *
 * Declara su dependencia de la lectura como input tipado
 * (`signalStoreFeature(input, ...)`), por lo que debe componerse DESPUÉS de
 * `withServerTable` en el mismo store: recarga su `query` actual tras cada
 * escritura.
 */
export function withServerTableWrites<E extends object, Id extends EntityId>(config: WithServerTableWritesConfig<E, Id>) {
    return signalStoreFeature(
        { methods: type<{ load: () => void }>() },

        withState({ saving: false }),

        withMethods((store) => {
            const repo = config.repository();

            return {
                /**
                 * Ejecuta una operación de escritura con el ciclo de vida
                 * estandarizado: `saving` activo, recarga de la query actual al
                 * resolver. Devuelve el Observable SIN suscribir.
                 */
                _runWrite<R>(op: () => Observable<R>): Observable<R> {
                    return defer(() => {
                        patchState(store, { saving: true });
                        return op();
                    }).pipe(
                        tap(() => store.load()),
                        finalize(() => patchState(store, { saving: false }))
                    );
                },

                createAndReload(...args: unknown[]): Observable<E> {
                    if (!repo.create) throw new Error('El repositorio no soporta "create"');
                    return this._runWrite(() => repo.create!(...args));
                },

                updateAndReload(id: Id, ...args: unknown[]): Observable<E> {
                    if (!repo.update) throw new Error('El repositorio no soporta "update"');
                    return this._runWrite(() => repo.update!(id, ...args));
                },

                deleteAndReload(id: Id): Observable<unknown> {
                    if (!repo.delete) throw new Error('El repositorio no soporta "delete"');
                    return this._runWrite(() => repo.delete!(id));
                }
            };
        })
    );
}
