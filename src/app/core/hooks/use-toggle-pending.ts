import { Signal } from '@angular/core';

export interface TableToggle<T, K extends string | number> {
    isToggling: (id: K) => boolean;
    onToggleActive: (item: T, active: boolean) => void;
}

export function useTogglePending<T, K extends string | number>(pendingIds: Signal<ReadonlySet<K>>, canToggle: Signal<boolean>, getId: (item: T) => K, emit: (item: T, active: boolean) => void): TableToggle<T, K> {
    const isToggling = (id: K) => pendingIds().has(id);

    const onToggleActive = (item: T, active: boolean) => {
        if (!canToggle() || isToggling(getId(item))) return;
        emit(item, active);
    };

    return { isToggling, onToggleActive };
}
