import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signalStore } from '@ngrx/signals';
import { Subject } from 'rxjs';

import { withPendingKeys } from './with-pending-keys.feature';

const TestStore = signalStore(withPendingKeys<string>());

describe('withPendingKeys', () => {
    let store: InstanceType<typeof TestStore>;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        store = TestBed.runInInjectionContext(() => new TestStore());
    });

    it('marks a key while the operation is in flight and clears it on complete', () => {
        const subject = new Subject<void>();

        subject.pipe(store.trackPending('CU')).subscribe();

        expect(store.isPending('CU')).toBe(true);
        expect(store.pendingSet().has('CU')).toBe(true);

        subject.complete();

        expect(store.isPending('CU')).toBe(false);
        expect(store.pendingSet().size).toBe(0);
    });

    it('clears the key when the operation fails', () => {
        const subject = new Subject<void>();

        subject.pipe(store.trackPending('CU')).subscribe({ error: () => undefined });
        subject.error(new Error('network down'));

        expect(store.isPending('CU')).toBe(false);
    });

    it('clears the key when the caller unsubscribes', () => {
        const subject = new Subject<void>();
        const subscription = subject.pipe(store.trackPending('CU')).subscribe();

        subscription.unsubscribe();

        expect(store.isPending('CU')).toBe(false);
    });

    it('tracks different keys independently', () => {
        const cuba = new Subject<void>();
        const spain = new Subject<void>();

        cuba.pipe(store.trackPending('CU')).subscribe();
        spain.pipe(store.trackPending('ES')).subscribe();

        expect(store.pendingSet()).toEqual(new Set(['CU', 'ES']));

        cuba.complete();

        expect(store.isPending('CU')).toBe(false);
        expect(store.isPending('ES')).toBe(true);
    });
});
