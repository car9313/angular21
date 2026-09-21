import { Signal } from '@angular/core';
import { QueryParams } from '../../../core/interfaces/query-params';
import { PaginationMeta } from '../../../core/interfaces/paginated-response';

/**
 * Contrato que todo listado paginado de personas debe satisfacer.
 *
 * Es implementado por los facades (o por un mock en tests) y consumido por
 * `TableListComponent` a través de su `@Input`, sin que la capa de presentación
 * inyecte ni conozca la implementación concreta. Así un único listado es
 * reutilizable en cualquier página con cualquier fuente de datos.
 *
 * Los consumidores NO paginados usan directamente `app-base-table`.
 */
export interface TableListDataSource {
    readonly items: Signal<unknown[]>;
    readonly loading: Signal<boolean>;
    readonly meta: Signal<PaginationMeta>;
    readonly query: Signal<QueryParams>;

    init(): void;
    reload(): void;
    setPage(page: number): void;
    setPageSize(size: number): void;
}
