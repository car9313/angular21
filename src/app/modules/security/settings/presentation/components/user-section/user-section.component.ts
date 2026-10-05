// src/app/modules/security/settings/presentation/components/user-section/user-section.component.ts
import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgClass } from '@angular/common';
import { FieldsetModule } from 'primeng/fieldset';
import { InputNumberModule } from 'primeng/inputnumber';

import { SETTINGS_RULES, UserSettings } from '../../../domain/security-settings';

/**
 * Presentational section for the user settings.
 * Pattern: owns its FormGroup, seeds from `settings` via effect, emits the
 * typed slice + validity on every change. Validators come from SETTINGS_RULES.
 */
@Component({
    selector: 'app-user-section',
    standalone: true,
    imports: [ReactiveFormsModule, NgClass, FieldsetModule, InputNumberModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <p-fieldset legend="Configuración de usuario" toggleable="true">
            <div [formGroup]="form" class="flex flex-col gap-2">
                <div class="flex flex-col gap-2">
                    <label for="usernameMinLength" class="font-bold">Longitud mínima de usuario:</label>
                    <p-inputNumber
                        inputId="usernameMinLength"
                        formControlName="usernameMinLength"
                        [min]="RULES.user.usernameMinLength.min"
                        [ngClass]="{ 'ng-invalid ng-dirty': invalid('usernameMinLength') }"
                        mode="decimal"
                    />
                    @if (hasError('usernameMinLength', 'required')) {
                        <small class="block mt-1 text-red-500 dark:text-red-400">El campo es requerido.</small>
                    }
                    @if (hasError('usernameMinLength', 'min')) {
                        <small class="block mt-1 text-red-500 dark:text-red-400">Valor mínimo: {{ RULES.user.usernameMinLength.min }}</small>
                    }
                </div>
            </div>
        </p-fieldset>
    `
})
export class UserSectionComponent {
    readonly settings = input.required<UserSettings>();

    readonly valueChange = output<UserSettings>();
    readonly valid = output<boolean>();

    protected readonly RULES = SETTINGS_RULES;

    private readonly fb = inject(NonNullableFormBuilder);

    protected readonly form = this.fb.group({
        usernameMinLength: [
            SETTINGS_RULES.user.usernameMinLength.min,
            [Validators.required, Validators.min(SETTINGS_RULES.user.usernameMinLength.min)]
        ]
    });

    constructor() {
        effect(() => {
            const settings = this.settings();
            const control = this.form.controls.usernameMinLength;
            if (control.value !== settings.usernameMinLength) {
                control.setValue(settings.usernameMinLength);
            }
        });

        this.form.valueChanges.subscribe(() => this.emitState());
    }

    protected hasError(controlName: string, typeError: string): boolean {
        const control = this.form.get(controlName);
        return !!control && control.hasError(typeError) && (control.touched || control.dirty);
    }

    protected invalid(controlName: string): boolean {
        const control = this.form.get(controlName);
        return !!control && control.invalid && (control.touched || control.dirty);
    }

    /** Marks every control as touched so validation errors surface at once. */
    markAllTouched(): void {
        this.form.markAllAsTouched();
    }

    private emitState(): void {
        this.valueChange.emit({
            usernameMinLength: this.form.controls.usernameMinLength.value
        });
        this.valid.emit(this.form.valid);
    }
}