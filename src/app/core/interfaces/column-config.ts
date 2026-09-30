export interface ColumnConfig<T> {
    field: keyof T;
    header: string;
    sortable: boolean;
    className?: string;
    cellTemplate?: (row: T) => string;
}
