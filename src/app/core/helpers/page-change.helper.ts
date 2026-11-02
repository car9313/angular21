import { PageChangeEvent } from '@/app/core/interfaces/page-change-event';

export interface PageableStore {
    pageSize(): number;
    setPageAndReload(page: number): void;
    setPageSizeAndReload(size: number): void;
}

export function handlePageChange(store: PageableStore, { page, pageSize }: PageChangeEvent): void {
    if (pageSize !== store.pageSize()) store.setPageSizeAndReload(pageSize);
    else store.setPageAndReload(page);
}
