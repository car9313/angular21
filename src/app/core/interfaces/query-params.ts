/**
 * Generic parameters for the .NET backend contract.
 *
 * The names match the wire contract of the API (query string shape):
 * - Pagination:  Pag.Page, Pag.PageSize
 * - Search:      Search.SearchText, Search.Strict
 * - Filters:     Filter  (JSON serialized)
 * - Sorting:     Sort[i].SortBy, Sort[i].Ascending
 */
export interface QueryParams {
    search: Search;
    filter: Filter[];
    sort: Sort[];
    pag: Pag;
}

export interface Pag {
    Page: number;
    PageSize: number;
}

export interface Search {
    SearchText: string;
    Strict: boolean;
}

export interface Filter {
    PropertyName: string;
    PropertyValue: string;
}

export interface Sort {
    SortBy: string;
    Ascending: boolean;
}

/**
 * Parche quirúrgico sobre un `QueryParams` existente.
 * - `search` y `pag`: parciales (merge campo a campo vía `mergeQuery`).
 * - `filter` y `sort`: reemplazo completo.
 */
export interface QueryPatch {
    search?: Partial<Search>;
    filter?: Filter[];
    sort?: Sort[];
    pag?: Partial<Pag>;
}

/**
 * Mezcla PURA de un parche sobre un query base. No muta `base`.
 *
 * - `search` y `pag`: merge anidado (un parche parcial de `pag` no pisa
 *   `search`, y viceversa).
 * - `filter` y `sort`: reemplazo completo si vienen en el parche; se
 *   conservan si no.
 * - NUNCA resetea la página: los setters que cambian el conjunto de
 *   resultados resetean `Page` explícitamente (ver `withQuery`).
 * - Las claves ausentes o con `undefined` explícito conservan el valor
 *   anterior: quien parsee la URL puede omitir las claves sin riesgo de
 *   envenenar el estado con valores indefinidos.
 */
export function mergeQuery(base: QueryParams, patch: QueryPatch): QueryParams {
    return {
        search: { ...base.search, ...patch.search },
        filter: patch.filter ?? base.filter,
        sort: patch.sort ?? base.sort,
        pag: { ...base.pag, ...patch.pag }
    };
}

/**
 * Factory for a fresh, empty query. A factory (not a shared const) guarantees
 * every consumer gets its own object, avoiding accidental cross-store mutation.
 */
export const defaultQuery = (): QueryParams => ({
    search: { SearchText: '', Strict: false },
    filter: [],
    sort: [],
    pag: { Page: 1, PageSize: 5 }
});
