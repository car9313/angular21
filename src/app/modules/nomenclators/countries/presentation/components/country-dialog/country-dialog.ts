import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Dialog } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

import { Country } from '@/app/modules/nomenclators/countries/domain/country';
import { CountriesListStore } from '@/app/modules/nomenclators/countries/presentation/stores/countries-list.store';
import { NotificationService } from '@/app/core/services/notification-services';

@Component({
    selector: 'app-country-dialog',
    standalone: true,
    imports: [NgClass, ReactiveFormsModule, Dialog, ButtonModule, InputTextModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './country-dialog.html'
})
export class CountryDialog {
    readonly country = input<Country | null>(null);

    readonly saved = output<void>();
    readonly cancelled = output<void>();

    protected readonly store = inject(CountriesListStore);
    private readonly notify = inject(NotificationService);
    private readonly fb = inject(NonNullableFormBuilder);

    protected readonly visible = signal(true);

    protected readonly title = computed(() => (this.country() ? 'Editar país' : 'Nuevo país'));

    protected readonly form = this.fb.group({
        name: ['', [Validators.required]],
        code: ['', [Validators.required]]
    });

    constructor() {
        effect(() => {
            const country = this.country();

            const name = country?.name ?? '';
            if (this.form.controls.name.value !== name) {
                this.form.controls.name.setValue(name);
            }

            const code = country?.code ?? '';
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

        const country = this.country();
        const payload = { name, code };
        const request$ = country ? this.store.updateAndReload(country.code, payload) : this.store.createAndReload(payload);
        const successMessage = country ? 'País actualizado correctamente.' : 'País creado correctamente.';

        request$.subscribe({
            next: () => {
                this.notify.show('success', successMessage);
                this.saved.emit();
            },
            error: (error: unknown) => this.notify.handleGenericError(error)
        });
    }
}
