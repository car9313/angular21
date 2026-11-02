import { signalStore } from '@ngrx/signals';
import { withServerTable } from '@/app/core/store/features/with-server-table.feature';

import { inject } from '@angular/core';

import { RequestRepository } from '@/app/modules/certification/requests/infraestructure/request-repository';
import { RequestModel } from '@/app/modules/certification/requests/domain/request';
import { withFiltersPersistence } from '@/app/core/store/features/with-filters-persistence.feature';

export const RequestStore = signalStore(
    withServerTable<RequestModel, string>({
        repository: () => inject(RequestRepository),
        errorMessage: 'No se pudieron cargar las auditorías.',
        selectId: 'id'
    }),
    withFiltersPersistence({
        storageKey: 'request.list.filters',
        ttlMs: 24 * 60 * 60 * 1000 // 24 horas
    })
);
