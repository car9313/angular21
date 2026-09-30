// core/utils/filters.util.ts
import { Filter } from '../interfaces/query-params';
import { formatDateToISO } from '@/app/core/helpers/date-mapper.helper';

/**
 * Convierte los valores de un formulario en filtros para la API.
 *
 * Contrato de serialización:
 * - `Date`   → 'YYYY-MM-DD' (componentes locales vía formatDateToISO)
 * - string   → pasa intacto
 * - null/undefined/''  → ignorado
 */
export function buildFilters(formValues: Record<string, unknown>): Filter[] {
    return Object.entries(formValues)
        .filter(([, value]) => value != null && value !== '')
        .map(([key, value]) => ({
            PropertyName: key,
            PropertyValue: value instanceof Date ? formatDateToISO(value) : String(value)
        }));
}
/**
 * Convierte `Filter[]` a un objeto plano (para `patchValue` en forms).
 */
export function filtersToObject(filters: Filter[] | undefined): Record<string, string> {
    return (filters ?? []).reduce((acc, filter) => ({ ...acc, [filter.PropertyName]: filter.PropertyValue }), {} as Record<string, string>);
}

/**
 * ¿Hay filtros activos?
 */
export function hasActiveFilters(filters: Filter[] | undefined): boolean {
    return (filters?.length ?? 0) > 0;
}
