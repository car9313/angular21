import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Dialog } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { NotificationService } from '@/app/core/services/notification-services';
import { Province } from '@/app/modules/nomenclators/provinces/domain/province';
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
        name: ['', [Validators.required]],
        code: ['', [Validators.required]]
    });

    constructor() {
        effect(() => {
            const province = this.province();

            const name = province?.descLong ?? '';
            if (this.form.controls.name.value !== name) {
                this.form.controls.name.setValue(name);
            }

            const code = province?.code ?? '';
            if (this.form.controls.code.value !== code) {
                this.form.controls.code.setValue(code);
            }
        });
    }

    protected onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const name = this.form.controls.name.value.trim();
        const code = this.form.controls.code.value.trim();

        if (!name || !code) {
            if (!name) {
                this.form.controls.name.setValue('');
                this.form.controls.name.markAsTouched();
            }
            if (!code) {
                this.form.controls.code.setValue('');
                this.form.controls.code.markAsTouched();
            }
            return;
        }

        const province = this.province();
        const payload = { name, code };
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
