import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Dialog } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { map, Observable, of } from 'rxjs';
import { NotificationService } from '@/app/core/services/notification-services';
import { AsyncSelectInfiniteComponent, SelectItem } from '@/app/shared/components/async-select-infinite/async-select-infinite.component';
import { Municipality, MunicipalityInput } from '@/app/modules/nomenclators/municipalities/domain/municipality';
import { MunicipalityListStore } from '@/app/modules/nomenclators/municipalities/presentation/stores/municipality-list.store';
import { ProvinceRepository } from '@/app/modules/nomenclators/provinces/infrastructure/http/province-repository';

interface SelectPage {
    objects: SelectItem[];
    nextCursor: string | null;
}

@Component({
    selector: 'app-municipality-dialog',
    standalone: true,
    imports: [NgClass, ReactiveFormsModule, Dialog, ButtonModule, InputTextModule, AsyncSelectInfiniteComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './municipality-dialog.html'
})
export class MunicipalityDialog {
    readonly municipality = input<Municipality | null>(null);

    readonly saved = output<void>();
    readonly cancelled = output<void>();

    protected readonly store = inject(MunicipalityListStore);
    private readonly provinceRepository = inject(ProvinceRepository);
    private readonly notify = inject(NotificationService);
    private readonly fb = inject(NonNullableFormBuilder);

    protected readonly visible = signal(true);

    protected readonly title = computed(() => (this.municipality() ? 'Editar municipio' : 'Nuevo municipio'));

    protected readonly form = this.fb.group({
        code: ['', [Validators.required]],
        shortName: ['', [Validators.required]],
        name: ['', [Validators.required]],
        provinceCode: ['', [Validators.required]]
    });

    protected readonly loadProvinces = (cursor?: string, searchTerm?: string): Observable<SelectPage> =>
        this.provinceRepository.listForSelect(cursor, searchTerm).pipe(
            map((page) => ({
                objects: page.objects.map((province) => ({ ...province })),
                nextCursor: page.nextCursor
            }))
        );

    protected readonly findProvince = (code: unknown): Observable<SelectItem | null> =>
        typeof code === 'string' && code.length > 0 ? this.provinceRepository.getById(code).pipe(map((province) => ({ ...province }))) : of(null);

    constructor() {
        effect(() => {
            const municipality = this.municipality();
            const values = {
                code: municipality?.code ?? '',
                shortName: municipality?.shortName ?? '',
                name: municipality?.name ?? '',
                provinceCode: municipality?.provinceCode ?? ''
            } as const;

            (Object.keys(values) as (keyof typeof values)[]).forEach((key) => {
                if (this.form.controls[key].value !== values[key]) {
                    this.form.controls[key].setValue(values[key]);
                }
            });
        });
    }

    protected onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const code = this.form.controls.code.value.trim();
        const shortName = this.form.controls.shortName.value.trim();
        const name = this.form.controls.name.value.trim();
        const provinceCode = this.form.controls.provinceCode.value.trim();

        if (!code || !shortName || !name || !provinceCode) {
            (['code', 'shortName', 'name', 'provinceCode'] as const).forEach((key) => {
                if (!this.form.controls[key].value.trim()) {
                    this.form.controls[key].setValue('');
                    this.form.controls[key].markAsTouched();
                }
            });
            return;
        }

        const municipality = this.municipality();
        const payload: MunicipalityInput = { code, shortName, name, provinceCode };
        const request$ = municipality ? this.store.updateAndReload(municipality.code, payload) : this.store.createAndReload(payload);
        const successMessage = municipality ? 'Municipio actualizado correctamente.' : 'Municipio creado correctamente.';

        request$.subscribe({
            next: () => {
                this.notify.show('success', successMessage);
                this.saved.emit();
            },
            error: (error: unknown) => this.notify.handleGenericError(error)
        });
    }
}
