import { Signal } from '@angular/core';
import { TableLazyLoadEvent } from 'primeng/table';
import { PageChangeEvent } from '@/app/core/interfaces/page-change-event';
import { getPaginated } from '@/app/core/helpers/table-lazy-load.helper';

export function useLazyLoad(currentPage: Signal<number>, pageSize: Signal<number>, emit: (event: PageChangeEvent) => void): (event: TableLazyLoadEvent) => void {
    return (event) => {
        const { page, pageSize: size } = getPaginated(event, pageSize());
        if (page !== currentPage() || size !== pageSize()) {
            emit({ page, pageSize: size });
        }
    };
}
