// src/app/modules/security/settings/presentation/components/password-section/password-section.component.ts
import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgClass } from '@angular/common';
import { FieldsetModule } from 'primeng/fieldset';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { Password } from 'primeng/password';

import { PasswordSettings, SETTINGS_RULES } from '../../../domain/security-settings';

/**
 * Presentational section for the password rules.
 *
 * Fixes over the reference:
 * - `requiresLowercase` IS present (the reference omitted the checkbox).
 * - `passwordDefaultValue` is a MASKED p-password (feedback off, toggleMask
 *   on) instead of a plain text input.
 * - Validators derive from SETTINGS_RULES instead of inline constants.
 */
@Component({
    selector: 'app-password-section',
    standalone: true,
    imports: [ReactiveFormsModule, NgClass, FieldsetModule, InputNumberModule, CheckboxModule, Password],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <p-fieldset legend="Configuración de contraseña" toggleable="true">
            <div [formGroup]="form" class="grid grid-cols-2 gap-5">
                <div class="flex flex-col gap-2">
                    <label for="validDays" class="font-bold">Tiempo de validez (días):</label>
                    <p-inputNumber
                        inputId="validDays"
                        formControlName="validDays"
                        [min]="RULES.password.validDays.min"
                        [ngClass]="{ 'ng-invalid ng-dirty': invalid('validDays') }"
                        mode="decimal"
                    />
                    @if (hasError('validDays', 'required')) {
                        <small class="block mt-1 text-red-500 dark:text-red-400">El campo es requerido.</small>
                    }
                    @if (hasError('validDays', 'min')) {
                        <small class="block mt-1 text-red-500 dark:text-red-400">Valor mínimo: {{ RULES.password.validDays.min }}</small>
                    }
                    @if (hasError('validDays', 'max')) {
                        <small class="block mt-1 text-red-500 dark:text-red-400">Valor máximo: {{ RULES.password.validDays.max }}</small>
                    }
                </div>

                <div class="flex flex-col gap-2">
                    <label for="historyMinCount" class="font-bold">Historial de contraseñas:</label>
                    <p-inputNumber
                        inputId="historyMinCount"
                        formControlName="historyMinCount"
                        [min]="RULES.password.historyMinCount.min"
                        [ngClass]="{ 'ng-invalid ng-dirty': invalid('historyMinCount') }"
                        mode="decimal"
                    />
                    @if (hasError('historyMinCount', 'required')) {
                        <small class="block mt-1 text-red-500 dark:text-red-400">El campo es requerido.</small>
                    }
                    @if (hasError('historyMinCount', 'min')) {
                        <small class="block mt-1 text-red-500 dark:text-red-400">Valor mínimo: {{ RULES.password.historyMinCount.min }}</small>
                    }
                </div>

                <div class="flex flex-col gap-2">
                    <label for="passwordDefaultValue" class="font-bold">Contraseña por defecto:</label>
                    <p-password
                        inputId="passwordDefaultValue"
                        formControlName="passwordDefaultValue"
                        [feedback]="false"
                        [toggleMask]="true"
                        [ngClass]="{ 'ng-invalid ng-dirty': invalid('passwordDefaultValue') }"
                        autocomplete="new-password"
                        fluid
                    />
                    @if (hasError('passwordDefaultValue', 'required')) {
                        <small class="block mt-1 text-red-500 dark:text-red-400">La contraseña por defecto es requerida.</small>
                    }
                </div>

                <div class="flex flex-col gap-2">
                    <label for="minLength" class="font-bold">Longitud mínima:</label>
                    <p-inputNumber
                        inputId="minLength"
                        formControlName="minLength"
                        [min]="RULES.password.minLength.min"
                        [ngClass]="{ 'ng-invalid ng-dirty': invalid('minLength') }"
                        mode="decimal"
                    />
                    @if (hasError('minLength', 'required')) {
                        <small class="block mt-1 text-red-500 dark:text-red-400">El campo es requerido.</small>
                    }
                    @if (hasError('minLength', 'min')) {
                        <small class="block mt-1 text-red-500 dark:text-red-400">Mínimo {{ RULES.password.minLength.min }} caracteres</small>
                    }
                </div>

                <div class="flex flex-col gap-3 col-span-2">
                    <div class="flex items-center gap-2">
                        <p-checkbox formControlName="requiresUppercase" [binary]="true" inputId="requiresUppercase" />
                        <label for="requiresUppercase" class="font-bold">Requerir mayúsculas</label>
                    </div>
                    <div class="flex items-center gap-2">
                        <p-checkbox formControlName="requiresLowercase" [binary]="true" inputId="requiresLowercase" />
                        <label for="requiresLowercase" class="font-bold">Requerir minúsculas</label>
                    </div>
                    <div class="flex items-center gap-2">
                        <p-checkbox formControlName="requiresDigits" [binary]="true" inputId="requiresDigits" />
                        <label for="requiresDigits" class="font-bold">Requerir números</label>
                    </div>
                    <div class="flex items-center gap-2">
                        <p-checkbox formControlName="requiresSpecialChars" [binary]="true" inputId="requiresSpecialChars" />
                        <label for="requiresSpecialChars" class="font-bold">Requerir caracteres especiales</label>
                    </div>
                </div>
            </div>
        </p-fieldset>
    `
})
export class PasswordSectionComponent {
    readonly settings = input.required<PasswordSettings>();

    readonly valueChange = output<PasswordSettings>();
    readonly valid = output<boolean>();

    protected readonly RULES = SETTINGS_RULES;

    private readonly fb = inject(NonNullableFormBuilder);

    protected readonly form = this.fb.group({
        validDays: [
            SETTINGS_RULES.password.validDays.min,
            [
                Validators.required,
                Validators.min(SETTINGS_RULES.password.validDays.min),
                Validators.max(SETTINGS_RULES.password.validDays.max)
            ]
        ],
        historyMinCount: [
            SETTINGS_RULES.password.historyMinCount.min,
            [Validators.required, Validators.min(SETTINGS_RULES.password.historyMinCount.min)]
        ],
        passwordDefaultValue: ['', [Validators.required]],
        minLength: [SETTINGS_RULES.password.minLength.min, [Validators.required, Validators.min(SETTINGS_RULES.password.minLength.min)]],
        requiresUppercase: [true],
        requiresLowercase: [true],
        requiresDigits: [true],
        requiresSpecialChars: [true]
    });

    constructor() {
        effect(() => {
            const settings = this.settings();
            const controls = this.form.controls;
            if (controls.validDays.value !== settings.validDays) {
                controls.validDays.setValue(settings.validDays);
            }
            if (controls.historyMinCount.value !== settings.historyMinCount) {
                controls.historyMinCount.setValue(settings.historyMinCount);
            }
            if (controls.passwordDefaultValue.value !== settings.passwordDefaultValue) {
                controls.passwordDefaultValue.setValue(settings.passwordDefaultValue);
            }
            if (controls.minLength.value !== settings.minLength) {
                controls.minLength.setValue(settings.minLength);
            }
            if (controls.requiresUppercase.value !== settings.requiresUppercase) {
                controls.requiresUppercase.setValue(settings.requiresUppercase);
            }
            if (controls.requiresLowercase.value !== settings.requiresLowercase) {
                controls.requiresLowercase.setValue(settings.requiresLowercase);
            }
            if (controls.requiresDigits.value !== settings.requiresDigits) {
                controls.requiresDigits.setValue(settings.requiresDigits);
            }
            if (controls.requiresSpecialChars.value !== settings.requiresSpecialChars) {
                controls.requiresSpecialChars.setValue(settings.requiresSpecialChars);
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
        const controls = this.form.controls;
        this.valueChange.emit({
            validDays: controls.validDays.value,
            historyMinCount: controls.historyMinCount.value,
            passwordDefaultValue: controls.passwordDefaultValue.value,
            minLength: controls.minLength.value,
            requiresUppercase: controls.requiresUppercase.value,
            requiresLowercase: controls.requiresLowercase.value,
            requiresDigits: controls.requiresDigits.value,
            requiresSpecialChars: controls.requiresSpecialChars.value
        });
        this.valid.emit(this.form.valid);
    }
}