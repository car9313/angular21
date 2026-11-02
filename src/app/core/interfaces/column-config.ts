export interface ColumnConfig<T> {
    field: keyof T;
    header: string;
    sortable?: boolean; // ← opcional, no obligatorio
    className?: string;
    cellTemplate?: (row: T) => string;
}
