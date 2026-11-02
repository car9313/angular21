import { describe, it, expect, vi } from 'vitest';

import { handlePageChange, PageableStore } from './page-change.helper';

function storeStub(pageSize = 10) {
    return {
        pageSize: vi.fn(() => pageSize),
        setPageAndReload: vi.fn<(page: number) => void>(),
        setPageSizeAndReload: vi.fn<(size: number) => void>()
    } satisfies PageableStore;
}

describe('handlePageChange', () => {
    it('changes only the page when the page size is unchanged', () => {
        const store = storeStub(10);

        handlePageChange(store, { page: 3, pageSize: 10 });

        expect(store.setPageAndReload).toHaveBeenCalledWith(3);
        expect(store.setPageSizeAndReload).not.toHaveBeenCalled();
    });

    it('changes only the page size when it differs from the store', () => {
        const store = storeStub(10);

        handlePageChange(store, { page: 1, pageSize: 20 });

        expect(store.setPageSizeAndReload).toHaveBeenCalledWith(20);
        expect(store.setPageAndReload).not.toHaveBeenCalled();
    });
});
