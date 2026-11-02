import { Component, computed, inject, input, output } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Dialog } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { getHttpErrorMessage } from '@/app/core/utils/http-error-message';
import { CountryDetailsSkeletonComponent } from '@/app/modules/nomenclators/countries/presentation/components/details-skeleton/country-details-skeleton';

import {
    MunicipalityRepository
} from '@/app/modules/nomenclators/municipalities/infraestructure/http/municipality-repository';

@Component({
    selector: 'app-municipality-detail-dialog',
    imports: [Dialog, Button, CountryDetailsSkeletonComponent],
    templateUrl: './municipality-detail-dialog.html'
})
export class MunicipalityDetailDialog {
    private readonly repo = inject(MunicipalityRepository);
    readonly municipalityCode = input.required<string>();
    readonly cancelled = output<void>();

    readonly resource = rxResource({
        params: () => this.municipalityCode(),
        stream: ({ params: code }) => this.repo.getById(code)
    });

    readonly municipality = computed(() => {
        if (this.resource.error()) return null;
        return this.resource.value() ?? null;
    });

    readonly loading = computed(() => this.resource.isLoading());

    readonly errorMsg = computed(() => {
        const error = this.resource.error();
        return error ? getHttpErrorMessage(error, 'No se pudo obtener los detalles de este municipio.') : null;
    });

    retryLoad(): void {
        this.resource.reload();
    }

    close(): void {
        this.cancelled.emit();
    }

    onVisibleChange(visible: boolean): void {
        if (!visible) this.close();
    }
}
