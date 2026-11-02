import { Signal } from '@angular/core';
import { TableActionMenuService } from '@/app/core/services/table-action-menu';
import { TableAction } from '@/app/core/interfaces/table-action';

export interface TableMenu<T extends object> {
    menuFor: (row: T) => ReturnType<TableActionMenuService<T>['getMenuModel']>;
    isMenuOpen: (row: T) => boolean;
    onMenuShow: (row: T) => void;
    onMenuHide: (row: T) => void;
}

export function useTableMenu<T extends object>(menuService: TableActionMenuService<T>, rowActions: Signal<TableAction<T>[]>): TableMenu<T> {
    return {
        menuFor: (row: T) => menuService.getMenuModel(row, rowActions()),
        isMenuOpen: (row: T) => menuService.isMenuOpen(row),
        onMenuShow: (row: T) => menuService.onMenuShow(row),
        onMenuHide: (row: T) => menuService.onMenuHide(row)
    };
}
