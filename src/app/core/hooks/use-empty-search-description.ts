import { computed, Signal } from '@angular/core';

export function useEmptySearchDescription(entityNamePlural: string, searchText: Signal<string>): Signal<string> {
    return computed(() => `No se encontraron ${entityNamePlural} que coincidan con «${searchText()}».`);
}
