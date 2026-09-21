import type { Permission } from './permission.interface';

/**
 * Una categoría de permisos agrupa varios Permission bajo un mismo nombre.
 * Se usa para organizar la UI en secciones (p. ej. "Usuarios", "Inventario", etc.).
 *
 * - name: nombre de la categoría.
 * - permissions.ts: arreglo de objetos Permission pertenecientes a esa categoría.
 */
export interface PermissionsCategory {
    category: string;
    permissions: Permission[];
}
