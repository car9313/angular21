// core/store/features/with-server-table-writes.feature.ts
import { signalStoreFeature, type, withMethods, withState, patchState } from '@ngrx/signals';
import { Observable, defer, finalize, tap } from 'rxjs';

import { QueryParams } from '../../interfaces/query-params';

/**
 * Acciones de escritura mínimas que una pantalla CRUD necesita.
 * Los argumentos concretos (p. ej. el nombre de un rol) los aporta cada
 * store/dominio al envolver estos métodos, no esta feature.
 */
export interface ServerTableWriteActions<E, Id> {
    create(...args: unknown[]): Observable<E>;
    update(id: Id, ...args: unknown[]): Observable<E>;
    delete(id: Id): Observable<unknown>;
}

export interface WithServerTableWritesConfig<E, Id> {
    /** Fábrica del repositorio (para poder `inject()` dentro del store). */
    repository: () => ServerTableWriteActions<E, Id>;
}

/** Estado de LECTURA requerido: lo aporta `withServerTable`. */
interface ServerTableReadState {
    query: QueryParams;
}

/**
 * Feature de ESCRITURA separable para grillas de servidor.
 *
 * Compónela SOLO en pantallas CRUD (Usuarios, Roles); una pantalla read-only
 * (Auditorías) nunca la compone — no arrastra escrituras ni estado `saving`.
 *
 * Declara su dependencia de la lectura como **input tipado**
 * (`signalStoreFeature(input, ...)`), por lo que debe componerse DESPUÉS de
 * `withServerTable` en el mismo store: recarga su `query` actual tras cada
 * escritura.
 *
 * - `saving` marca la operación en vuelo (limpia en `finalize`, también si
 *   falla).
 * - Cada `*AndReload` recarga la query actual al resolver.
 */
export function withServerTableWrites<E extends { id: Id }, Id extends string | number>(
    config: WithServerTableWritesConfig<E, Id>
) {
    const { repository } = config;

    return signalStoreFeature(
        // Input tipado: exige `withServerTable` compuesta ANTES en el store
        // (consume su `query` y su `load`). Los métodos van como literal
        // inline: un `interface` no recibe la implicit index signature que
        // exige `MethodsDictionary`.
        {
            state: type<ServerTableReadState>(),
            methods: type<{
                load: (query: QueryParams) => void;
            }>()
        },

        withState({ saving: false }),

        withMethods((store) => {
            const repo = repository();

            return {
                /**
                 * Ejecuta una operación de escritura con el ciclo de vida
                 * estandarizado: `saving` activo, recarga de la query actual al
                 * resolver. Devuelve el Observable SIN suscribir: el llamador
                 * decide cuándo disparar y notifica éxito/error.
                 */
                _runWrite<R>(op: () => Observable<R>): Observable<R> {
                    return defer(() => {
                        patchState(store, { saving: true });
                        return op();
                    }).pipe(
                        tap(() => store.load(store.query())),
                        finalize(() => patchState(store, { saving: false }))
                    );
                },

                createAndReload(...args: unknown[]): Observable<E> {
                    return this._runWrite(() => repo.create(...args));
                },

                updateAndReload(id: Id, ...args: unknown[]): Observable<E> {
                    return this._runWrite(() => repo.update(id, ...args));
                },

                deleteAndReload(id: Id): Observable<unknown> {
                    return this._runWrite(() => repo.delete(id));
                }
            };
        })
    );
}
