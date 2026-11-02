import { signalStore, withMethods, patchState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { EMPTY, Observable, defer, map, tap } from 'rxjs';

import { withServerTable } from '@/app/core/store/features/with-server-table.feature';
import { withServerTableWrites } from '@/app/core/store/features/with-server-table-writes.feature';
import { withFiltersPersistence } from '@/app/core/store/features/with-filters-persistence.feature';
import { withModal } from '@/app/core/store/features/with-modal.feature';
import { withPendingKeys } from '@/app/core/store/features/with-pending-keys.feature';
import { Country } from '@/app/modules/nomenclators/countries/domain/country';
import { CountryRepository } from '@/app/modules/nomenclators/countries/infrastructure/http/country-repository';

export type CountriesModalMode = 'add' | 'edit' | 'detail';

export const CountriesListStore = signalStore(
    withServerTable<Country, string>({
        repository: () => inject(CountryRepository),
        errorMessage: 'No se pudieron cargar los países.',
        selectId:'code'
    }),
    withFiltersPersistence({ storageKey: 'countries.list.filters' }),
    withServerTableWrites<Country, string>({
        repository: () => inject(CountryRepository)
    }),
    withModal<CountriesModalMode, Country>(),
    withPendingKeys<string>(),

    withMethods((store) => {
        const repo = inject(CountryRepository);

        return {
            openAdd(): void {
                store.openModal('add', null);
            },

            openEdit(item: Country): void {
                store.select(item.code);
                store.openModal('edit', item);
            },

            openDetail(item: Country): void {
                store.select(item.code);
                store.openModal('detail', item);
            },

            closeModalAndClearSelection(): void {
                store.closeModal();
                store.clearSelection();
            },

            getById(code: string): Observable<Country> {
                return repo.getById(code);
            },
            setActive(item: Country, active: boolean): Observable<void> {
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
