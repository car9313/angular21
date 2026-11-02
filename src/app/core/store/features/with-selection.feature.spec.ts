import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signalStore } from '@ngrx/signals';

import { withSelection } from './with-selection.feature';

const TestStore = signalStore(withSelection<string>());

describe('withSelection', () => {
    let store: InstanceType<typeof TestStore>;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        store = TestBed.runInInjectionContext(() => new TestStore());
    });

    it('starts without a selection', () => {
        expect(store.selectedId()).toBeNull();
    });

    it('selects and replaces the id', () => {
        store.select('CU');
        expect(store.selectedId()).toBe('CU');

        store.select('ES');
        expect(store.selectedId()).toBe('ES');
    });

    it('clears the selection', () => {
        store.select('CU');
        store.clearSelection();

        expect(store.selectedId()).toBeNull();
    });
});
