// modules/nomenclators/providers/province-list.store.ts
import { signalStore, withMethods, patchState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { EMPTY, Observable, defer, map, tap } from 'rxjs';

import { withServerTable } from '@/app/core/store/features/with-server-table.feature';
import { withServerTableWrites } from '@/app/core/store/features/with-server-table-writes.feature';
import { withFiltersPersistence } from '@/app/core/store/features/with-filters-persistence.feature';
import { withModal } from '@/app/core/store/features/with-modal.feature';
import { withPendingKeys } from '@/app/core/store/features/with-pending-keys.feature';
import { Province } from '@/app/modules/nomenclators/provinces/domain/province';
import { ProvinceRepository } from '@/app/modules/nomenclators/provinces/infraestructure/http/province-repository';

export type ProvinceModalMode = 'add' | 'edit' | 'detail';

export const ProvinceListStore = signalStore(
    withServerTable<Province, string>({
        repository: () => inject(ProvinceRepository),
        errorMessage: 'No se pudieron cargar las provincias.',
        selectId: 'code'
    }),
    withFiltersPersistence({ storageKey: 'provinces.list.filters' }),
    withServerTableWrites<Province, string>({
        repository: () => inject(ProvinceRepository)
    }),
    withModal<ProvinceModalMode, Province>(),
    withPendingKeys<string>(),

    withMethods((store) => {
        const repo = inject(ProvinceRepository);

        return {
            openAdd(): void {
                store.openModal('add', null);
            },

            openEdit(item: Province): void {
                store.select(item.code);
                store.openModal('edit', item);
            },

            openDetail(item: Province): void {
                store.select(item.code);
                store.openModal('detail', item);
            },

            closeModalAndClearSelection(): void {
                store.closeModal();
                store.clearSelection();
            },

            getById(code: string): Observable<Province> {
                return repo.getById(code);
            },

            setActive(item: Province, active: boolean): Observable<void> {
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
