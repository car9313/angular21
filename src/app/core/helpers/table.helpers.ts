/**
 * Helper puro: busca el item seleccionado por id.
 * Úsalo solo si prefieres escribir tu propio `computed()` en el componente.
 * Si no, usa `useSelectedItem` (hook), que ya lo encapsula.
 */
export function findSelected<T, K extends string | number>(items: T[], id: K | null | undefined, getId: (item: T) => K): T | null {
    if (id === null || id === undefined || id === '') return null;
    return items.find((i) => getId(i) === id) ?? null;
}
