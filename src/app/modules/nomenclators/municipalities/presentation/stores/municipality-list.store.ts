import { signalStore, withMethods, patchState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { EMPTY, Observable, defer, map, tap } from 'rxjs';

import { withServerTable } from '@/app/core/store/features/with-server-table.feature';
import { withServerTableWrites } from '@/app/core/store/features/with-server-table-writes.feature';
import { withFiltersPersistence } from '@/app/core/store/features/with-filters-persistence.feature';
import { withModal } from '@/app/core/store/features/with-modal.feature';
import { withPendingKeys } from '@/app/core/store/features/with-pending-keys.feature';
import { Municipality } from '@/app/modules/nomenclators/municipalities/domain/municipality';
import {
    MunicipalityRepository
} from '@/app/modules/nomenclators/municipalities/infraestructure/http/municipality-repository';


export type MunicipalityModalMode = 'add' | 'edit' | 'detail';

export const MunicipalityListStore = signalStore(
    withServerTable<Municipality, string>({
        repository: () => inject(MunicipalityRepository),
        errorMessage: 'No se pudieron cargar los municipios.',
        selectId: 'code'
    }),
    withFiltersPersistence({ storageKey: 'municipalities.list.filters' }),
    withServerTableWrites<Municipality, string>({
        repository: () => inject(MunicipalityRepository)
    }),
    withModal<MunicipalityModalMode, Municipality>(),
    withPendingKeys<string>(),

    withMethods((store) => {
        const repo = inject(MunicipalityRepository);

        return {
            openAdd(): void {
                store.openModal('add', null);
            },

            openEdit(item: Municipality): void {
                store.select(item.code);
                store.openModal('edit', item);
            },

            openDetail(item: Municipality): void {
                store.select(item.code);
                store.openModal('detail', item);
            },

            closeModalAndClearSelection(): void {
                store.closeModal();
                store.clearSelection();
            },

            getById(code: string): Observable<Municipality> {
                return repo.getById(code);
            },

            setActive(item: Municipality, active: boolean): Observable<void> {
                const { code } = item;

                return defer(() => {
                    if (store.isPending(code)) return EMPTY;

                    const request$ = active ? repo.activate(code) : repo.deactivate(code);

                    return request$.pipe(
                        tap(() =>
                            patchState(store, (state) => ({
                                entityMap: {
                                    ...state.entityMap,
                                    [code]: {
                                        ...(state.entityMap[code] ?? item),
                                        active
                                    }
                                }
                            }))
                        ),
                        map(() => undefined),
                        store.trackPending(code)
                    );
                });
            }
        };
    })
);
