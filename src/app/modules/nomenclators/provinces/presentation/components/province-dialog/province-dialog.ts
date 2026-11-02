import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Dialog } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { NotificationService } from '@/app/core/services/notification-services';
import { Province, ProvinceInput } from '@/app/modules/nomenclators/provinces/domain/province';
import { ProvinceListStore } from '@/app/modules/nomenclators/provinces/presentation/stores/province-list.store';

@Component({
    selector: 'app-province-dialog',
    standalone: true,
    imports: [NgClass, ReactiveFormsModule, Dialog, ButtonModule, InputTextModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './province-dialog.html'
})
export class ProvinceDialog {
    readonly province = input<Province | null>(null);

    readonly saved = output<void>();
    readonly cancelled = output<void>();

    protected readonly store = inject(ProvinceListStore);
    private readonly notify = inject(NotificationService);
    private readonly fb = inject(NonNullableFormBuilder);

    protected readonly visible = signal(true);

    protected readonly title = computed(() => (this.province() ? 'Editar provincia' : 'Nueva provincia'));

    protected readonly form = this.fb.group({
        code: ['', [Validators.required]],
        shortName: ['', [Validators.required]],
        name: ['', [Validators.required]]
    });

    constructor() {
        effect(() => {
            const province = this.province();
            const values = {
                code: province?.code ?? '',
                shortName: province?.shortName ?? '',
                name: province?.name ?? ''
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

        if (!code || !shortName || !name) {
            (['code', 'shortName', 'name'] as const).forEach((key) => {
                if (!this.form.controls[key].value.trim()) {
                    this.form.controls[key].setValue('');
                    this.form.controls[key].markAsTouched();
                }
            });
            return;
        }

        const province = this.province();
        const payload: ProvinceInput = { code, shortName, name };
        const request$ = province ? this.store.updateAndReload(province.code, payload) : this.store.createAndReload(payload);
        const successMessage = province ? 'Provincia actualizada correctamente.' : 'Provincia creada correctamente.';

        request$.subscribe({
            next: () => {
                this.notify.show('success', successMessage);
                this.saved.emit();
            },
            error: (error: unknown) => this.notify.handleGenericError(error)
        });
    }
}
