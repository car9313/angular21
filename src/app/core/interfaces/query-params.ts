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
    filter?: Filter[];
    sort?: Sort[];
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
 * Factory for a fresh, empty query. A factory (not a shared const) guarantees
 * every consumer gets its own object, avoiding accidental cross-store mutation.
 */
export const defaultQuery = (): QueryParams => ({
    search: { SearchText: '', Strict: false },
    filter: [],
    sort: [],
    pag: { Page: 1, PageSize: 10 }
});