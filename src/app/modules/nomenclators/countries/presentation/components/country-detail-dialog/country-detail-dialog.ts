import { Component, computed, inject, input, output } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Dialog } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { CountriesListStore } from '@/app/modules/nomenclators/countries/presentation/stores/countries-list.store';
import { getHttpErrorMessage } from '@/app/core/utils/http-error-message';
import { CountryDetailsSkeletonComponent } from '@/app/modules/nomenclators/countries/presentation/components/details-skeleton/country-details-skeleton';

@Component({
    selector: 'app-country-detail-dialog',
    imports: [Dialog, Button, CountryDetailsSkeletonComponent],
    templateUrl: './country-detail-dialog.html'
})
export class CountryDetailDialog {
    private readonly store = inject(CountriesListStore);

    readonly countryCode = input.required<string>();
    readonly cancelled = output<void>();

    readonly countryResource = rxResource({
        params: () => this.countryCode(),
        stream: ({ params: code }) => this.store.getById(code)
    });

    readonly country = computed(() => {
        if (this.countryResource.error()) return null;
        return this.countryResource.value() ?? null;
    });

    readonly loading = computed(() => this.countryResource.isLoading());

    readonly errorMsg = computed(() => {
        const error = this.countryResource.error();
        return error ? getHttpErrorMessage(error, 'No se pudo obtener los detalles de este país.') : null;
    });

    retryLoad(): void {
        this.countryResource.reload();
    }

    close(): void {
        this.cancelled.emit();
    }

    onVisibleChange(visible: boolean): void {
        if (!visible) this.close();
    }
}
