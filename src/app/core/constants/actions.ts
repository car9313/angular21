/**
 * Permission actions (RBAC). Values match the backend permission contract.
 */
export const ACTIONS = {
    Read: 'Leer',
    Create: 'Crear',
    Update: 'Actualizar',
    Delete: 'Eliminar'
} as const;

export type Action = (typeof ACTIONS)[keyof typeof ACTIONS];
