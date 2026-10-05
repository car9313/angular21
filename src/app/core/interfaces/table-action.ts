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
    /**
     * Visual severity of the menu item. PrimeNG v21 `MenuItem` has no
     * `severity` field, so `TableActionMenuService` maps it (danger → red
     * text) when building the popup model. Destructive actions should set it.
     */
    severity?: 'danger';
}
