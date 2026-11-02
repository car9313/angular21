import { computed, Signal } from '@angular/core';

export interface TablePagination {
    first: Signal<number>;
    visibleRowsPerPageOptions: Signal<number[] | undefined>;
}

export function usePagination(currentPage: Signal<number>, pageSize: Signal<number>, totalRecords: Signal<number>, rowsPerPageOptions: Signal<number[]>): TablePagination {
    const first = computed(() => (currentPage() - 1) * pageSize());

    const visibleRowsPerPageOptions = computed<number[] | undefined>(() => (totalRecords() > pageSize() ? rowsPerPageOptions() : undefined));

    return { first, visibleRowsPerPageOptions };
}
