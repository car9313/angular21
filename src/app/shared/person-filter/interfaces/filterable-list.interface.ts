import { Signal } from '@angular/core';
import { QueryParams } from '../../../core/interfaces/query-params'; // Ajusta la ruta según tu proyecto

export interface FilterableList {
    /** Signal con los parámetros de consulta actuales (incluye filtros, paginación, etc.) */
    query: Signal<QueryParams>;
    /** Actualiza los filtros de la lista */
    setFilters(filters: QueryParams['filter']): void;
    /** Limpia todos los parámetros de consulta (vuelve al estado inicial) */
    clearQueryParams(): void;
}
