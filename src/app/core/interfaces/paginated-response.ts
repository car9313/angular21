/**
 * Generic paginated response contract for the .NET backend.
 */
export interface PaginatedResponse<T> {
    objects: T[];
    meta: PaginationMeta;
}

export interface PaginationMeta {
    currentPage: number;
    nextPage: number | null;
    prevPage: number | null;
    totalPage: number;
    totalCount: number;
}

/**
 * Stable empty response, useful as initial state in stores.
 */
export const emptyPaginatedResponse = <T>(): PaginatedResponse<T> => ({
    objects: [] as T[],
    meta: {
        currentPage: 1,
        nextPage: null,
        prevPage: null,
        totalPage: 1,
        totalCount: 0
    }
});
