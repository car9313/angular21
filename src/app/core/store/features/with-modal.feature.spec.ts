import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signalStore } from '@ngrx/signals';

import { withModal } from './with-modal.feature';

interface Item {
    id: number;
}

const TestStore = signalStore(withModal<'add' | 'edit' | 'detail', Item>());

describe('withModal', () => {
    let store: InstanceType<typeof TestStore>;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        store = TestBed.runInInjectionContext(() => new TestStore());
    });

    it('starts closed with no item', () => {
        expect(store.modalMode()).toBeNull();
        expect(store.modalItem()).toBeNull();
        expect(store.isModalOpen()).toBe(false);
    });

    it('opens in add mode without an item', () => {
        store.openModal('add');

        expect(store.modalMode()).toBe('add');
        expect(store.modalItem()).toBeNull();
        expect(store.isModalOpen()).toBe(true);
    });

    it('opens in edit mode with the selected item', () => {
        store.openModal('edit', { id: 7 });

        expect(store.modalMode()).toBe('edit');
        expect(store.modalItem()).toEqual({ id: 7 });
    });

    it('closes and clears the item', () => {
        store.openModal('detail', { id: 7 });
        store.closeModal();

        expect(store.modalMode()).toBeNull();
        expect(store.modalItem()).toBeNull();
        expect(store.isModalOpen()).toBe(false);
    });
});
