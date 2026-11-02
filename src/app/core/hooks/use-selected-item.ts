import { computed, Signal } from '@angular/core';

export function useSelectedItem<T, K extends string | number>(items: Signal<T[]>, selectedId: Signal<K | null>, getId: (item: T) => K): Signal<T | null> {
    return computed(() => {
        const id = selectedId();
        if (id === null || id === undefined || id === '') return null;
        return items().find((i) => getId(i) === id) ?? null;
    });
}
