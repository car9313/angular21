export interface Permissions {
    /** Identificador del recurso (por ejemplo: 'usuarios', 'productos', etc.) */
    resource: string;
    /** Array de acciones habilitadas para este recurso (p.ej. ['create','read']) */
    actions: string[];
    /** Descripción opcional */
    description?: string;
}
