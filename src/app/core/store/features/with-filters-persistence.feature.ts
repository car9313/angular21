// core/store/features/with-filters-persistence.feature.ts
import { signalStoreFeature, withHooks, withMethods, patchState, type } from '@ngrx/signals';
import { effect } from '@angular/core';
import { QueryParams } from '../../interfaces/query-params';

/**
 * Versión del formato persistido.
 * Incrementar cuando cambie el shape de `QueryParams`.
 * Si la versión del storage no coincide, se descarta.
 */
const STORAGE_VERSION = 1;

/** Payload persistido en sessionStorage. */
interface PersistedQuery {
    version: number;
    data: QueryParams;
}

/** Estado requerido por la feature: el store debe exponer `query`. */
interface FiltersPersistenceInput {
    query: QueryParams;
}

export interface FiltersPersistenceConfig {
    /** Clave única en sessionStorage. Ej: 'roles.list.filters' */
    storageKey: string;
    /**
     * Tiempo de vida del payload en milisegundos.
     * Si no se especifica, no expira.
     */
    ttlMs?: number;
}

/**
 * Persiste `query` (filtros, search, paginación) en sessionStorage.
 *
 * - Al inicializar el store, restaura el query persistido si existe.
 * - Cada vez que `query` cambia, lo persiste automáticamente.
 * - Versionado: si la versión no coincide, descarta el payload.
 * - TTL opcional: si el payload expira, se descarta.
 * - No persiste selección, modales, ni loading (no aplica).
 *
 * Requiere que el store tenga `query` (normalmente via `withQuery()`).
 */
export function withFiltersPersistence(config: FiltersPersistenceConfig) {
    const { storageKey, ttlMs } = config;

    return signalStoreFeature(
        { state: type<FiltersPersistenceInput>() },

        withMethods((store) => ({
            /**
             * Lee de sessionStorage y aplica al store.
             * Devuelve `true` si había datos válidos y se restauraron.
             * @internal
             */
            _restoreFromStorage(): boolean {
                try {
                    const raw = sessionStorage.getItem(storageKey);
                    if (!raw) return false;

                    const parsed = JSON.parse(raw) as PersistedQuery;

                    // Validación de versión
                    if (parsed.version !== STORAGE_VERSION) {
                        sessionStorage.removeItem(storageKey);
                        return false;
                    }

                    // Validación de shape mínimo
                    if (!parsed.data?.pag || !parsed.data?.search) {
                        sessionStorage.removeItem(storageKey);
                        return false;
                    }

                    // Validación de TTL (si está configurado)
                    if (ttlMs !== undefined) {
                        const age = Date.now() - (parsed as PersistedQuery & { savedAt?: number }).savedAt!;
                        if (age > ttlMs) {
                            sessionStorage.removeItem(storageKey);
                            return false;
                        }
                    }

                    patchState(store, { query: parsed.data });
                    return true;
                } catch {
                    // JSON corrupto o sessionStorage no disponible: limpia y sigue
                    try {
                        sessionStorage.removeItem(storageKey);
                    } catch {
                        // no-op
                    }
                    return false;
                }
            },

            /**
             * Persiste el query actual en sessionStorage.
             * @internal
             */
            _persistToStorage(): void {
                try {
                    const payload: PersistedQuery & { savedAt?: number } = {
                        version: STORAGE_VERSION,
                        data: store.query()
                    };
                    if (ttlMs !== undefined) {
                        payload.savedAt = Date.now();
                    }
                    sessionStorage.setItem(storageKey, JSON.stringify(payload));
                } catch {
                    // sessionStorage lleno o no disponible: no-op
                }
            },

            /**
             * Borra la persistencia.
             * Llamar al limpiar filtros para no dejar datos huérfanos.
             * @internal
             */
            _clearStorage(): void {
                try {
                    sessionStorage.removeItem(storageKey);
                } catch {
                    // no-op
                }
            }
        })),

        withHooks({
            onInit(store) {
                // 1. Restaurar antes de enganchar el effect de persistencia.
                //    Así evitamos sobrescribir con el estado inicial.
                store._restoreFromStorage();

                // 2. Persistir automáticamente cada vez que cambia `query`.
                //    Leer `store.query()` dentro del effect lo rastrea como dependencia.
                effect(() => {
                    // Referenciar el signal para que el effect se registre.
                    void store.query();
                    // Persistir
                    store._persistToStorage();
                });
            }
        })
    );
}
