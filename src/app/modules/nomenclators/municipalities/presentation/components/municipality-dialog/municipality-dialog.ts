import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Dialog } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { NotificationService } from '@/app/core/services/notification-services';
import { Municipality } from '@/app/modules/nomenclators/municipalities/domain/municipality';
import { MunicipalityListStore } from '@/app/modules/nomenclators/municipalities/presentation/stores/municipality-list.store';

@Component({
    selector: 'app-municipality-dialog',
    standalone: true,
    imports: [NgClass, ReactiveFormsModule, Dialog, ButtonModule, InputTextModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './municipality-dialog.html'
})
export class MunicipalityDialog {
    readonly municipality = input<Municipality | null>(null);

    readonly saved = output<void>();
    readonly cancelled = output<void>();

    protected readonly store = inject(MunicipalityListStore);
    private readonly notify = inject(NotificationService);
    private readonly fb = inject(NonNullableFormBuilder);

    protected readonly visible = signal(true);

    protected readonly title = computed(() => (this.municipality() ? 'Editar municipio' : 'Nuevo municipio'));

    protected readonly form = this.fb.group({
        code: ['', [Validators.required]],
        descShort: ['', [Validators.required]],
        descLong: ['', [Validators.required]]
    });

    constructor() {
        effect(() => {
            const municipality = this.municipality();
            const values = {
                code: municipality?.code ?? '',
                descShort: municipality?.descShort ?? '',
                descLong: municipality?.descLong ?? ''
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
        const descShort = this.form.controls.descShort.value.trim();
        const descLong = this.form.controls.descLong.value.trim();

        if (!code || !descShort || !descLong) {
            (['code', 'descShort', 'descLong'] as const).forEach((key) => {
                if (!this.form.controls[key].value.trim()) {
                    this.form.controls[key].setValue('');
                    this.form.controls[key].markAsTouched();
                }
            });
            return;
        }

        const municipality = this.municipality();
        const payload = { code, descShort, descLong };
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
