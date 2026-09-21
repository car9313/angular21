/**
 * Un Permission describe, para un recurso dado,
 * qué acciones (strings) están disponibles.
 *
 * - resource: identificador del recurso (p. ej. 'usuarios', 'productos', etc.).
 * - actions: lista de nombres de acciones que se pueden hacer sobre ese recurso
 *            (ej. ['create', 'read', 'update', 'delete']).
 * - description (opcional): una descripción human-readable del permiso.
 */
export interface Permission {
    resource: string;
    actions: string[];
    description?: string;
}
