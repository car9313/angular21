import { Component, computed, inject, input, output } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Dialog } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { getHttpErrorMessage } from '@/app/core/utils/http-error-message';
import { CountryDetailsSkeletonComponent } from '@/app/modules/nomenclators/countries/presentation/components/details-skeleton/country-details-skeleton';
import { ProvinceRepository } from '@/app/modules/nomenclators/provinces/infrastructure/http/province-repository';

@Component({
    selector: 'app-province-detail-dialog',
    imports: [Dialog, Button, CountryDetailsSkeletonComponent],
    templateUrl: './province-detail-dialog.html'
})
export class ProvinceDetailDialog {
    private readonly repo = inject(ProvinceRepository);
    readonly provinceCode = input.required<string>();
    readonly cancelled = output<void>();

    readonly provinceResource = rxResource({
        params: () => this.provinceCode(),
        stream: ({ params: code }) => this.repo.getById(code)
    });

    readonly province = computed(() => {
        if (this.provinceResource.error()) return null;
        return this.provinceResource.value() ?? null;
    });

    readonly loading = computed(() => this.provinceResource.isLoading());

    readonly errorMsg = computed(() => {
        const error = this.provinceResource.error();
        return error ? getHttpErrorMessage(error, 'No se pudo obtener los detalles de esta provincia.') : null;
    });

    retryLoad(): void {
        this.provinceResource.reload();
    }

    close(): void {
        this.cancelled.emit();
    }

    onVisibleChange(visible: boolean): void {
        if (!visible) this.close();
    }
}
