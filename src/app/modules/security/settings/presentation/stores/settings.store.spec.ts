import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Observable, throwError } from 'rxjs';

import { SettingsStore } from './settings.store';
import { SettingsRepository } from '../../infrastructure/settings-repository';
import { makeSecuritySettings } from '../../domain/security-settings';

const ENTITY = makeSecuritySettings({ accessTokenExpireMinute: 30, passwordSettings: { minLength: 12 } });

/** Observable que resuelve en un microtask: permite asertar el estado "en vuelo". */
function asyncValue<T>(value: T): Observable<T> {
    return new Observable((subscriber) => {
        queueMicrotask(() => {
            subscriber.next(value);
            subscriber.complete();
        });
    });
}

async function settle(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
}

describe('SettingsStore', () => {
    let repository: { get: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn> };
    let store: InstanceType<typeof SettingsStore>;

    beforeEach(() => {
        repository = {
            get: vi.fn(() => asyncValue(ENTITY)),
            save: vi.fn(() => asyncValue(ENTITY))
        };

        TestBed.configureTestingModule({
            providers: [{ provide: SettingsRepository, useValue: repository }]
        });

        store = TestBed.runInInjectionContext(() => new SettingsStore());
    });

    it('starts empty and idle', () => {
        expect(store.current()).toBeNull();
        expect(store.loading()).toBe(false);
        expect(store.saving()).toBe(false);
        expect(store.error()).toBeNull();
    });

    it('load resolves the settings, clears loading and keeps error null', async () => {
        store.load();

        expect(store.loading()).toBe(true);
        expect(repository.get).toHaveBeenCalledTimes(1);

        await settle();

        expect(store.loading()).toBe(false);
        expect(store.current()).toEqual(ENTITY);
        expect(store.error()).toBeNull();
    });

    it('exposes error and stops loading when the fetch fails', async () => {
        repository.get.mockReturnValue(throwError(() => new Error('red timeout')));

        store.load();
        await settle();

        expect(store.loading()).toBe(false);
        expect(store.error()).toBe('red timeout');
        expect(store.current()).toBeNull();
    });

    it('save patches current and clears saving when it succeeds', async () => {
        repository.save.mockReturnValue(
            new Observable<typeof ENTITY>((subscriber) => {
                // Estado observable en vuelo: saving debe estar activo al emitir.
                expect(store.saving()).toBe(true);
                queueMicrotask(() => {
                    subscriber.next(ENTITY);
                    subscriber.complete();
                });
            })
        );

        const result$ = store.save(ENTITY);
        const done = new Promise<void>((resolve) => result$.subscribe({ complete: () => resolve() }));
        await done;

        expect(repository.save).toHaveBeenCalledWith(ENTITY);
        expect(store.current()).toEqual(ENTITY);
        expect(store.saving()).toBe(false);
        expect(store.error()).toBeNull();
    });

    it('clears saving also when the save fails', async () => {
        repository.save.mockReturnValue(
            new Observable<typeof ENTITY>((subscriber) => {
                expect(store.saving()).toBe(true);
                queueMicrotask(() => subscriber.error(new Error('network down')));
            })
        );

        const result$ = store.save(ENTITY);
        await new Promise<void>((resolve) => result$.subscribe({ error: () => resolve() }));
        expect(store.saving()).toBe(false);
    });
});