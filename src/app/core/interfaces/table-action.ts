import { Resource } from '@/app/core/constants/resources';
import { Action } from '@/app/core/constants/actions';

export interface PermissionContext {
    resource: Resource;
    action: Action;
}

export type PermissionContextResolver<T> = PermissionContext | ((row: T) => PermissionContext);

export interface TableAction<T> {
    label: string;
    icon: string;
    permission: PermissionContextResolver<T>;
    command: (row: T) => void;
    visible?: (row: T) => boolean;
    disabled?: (row: T) => boolean;
}
