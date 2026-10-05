// src/app/modules/security/settings/presentation/components/auth-section/auth-section.component.ts
import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgClass } from '@angular/common';
import { FieldsetModule } from 'primeng/fieldset';
import { InputNumberModule } from 'primeng/inputnumber';

import { LockOutSettings, SETTINGS_RULES } from '../../../domain/security-settings';

/**
 * Presentational section for the lock-out (authentication) settings.
 * Pattern: owns its FormGroup, seeds from `settings` via effect, emits the
 * typed slice + validity on every change. Validators come from SETTINGS_RULES.
 */
@Component({
    selector: 'app-auth-section',
    standalone: true,
    imports: [ReactiveFormsModule, NgClass, FieldsetModule, InputNumberModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <p-fieldset legend="Configuración de autenticación" toggleable="true">
            <div [formGroup]="form" class="grid grid-cols-2 gap-5">
                <div class="flex flex-col gap-2">
                    <label for="maxAttempts" class="font-bold">Intentos fallidos máximos:</label>
                    <p-inputNumber
                        inputId="maxAttempts"
                        formControlName="maxAttempts"
                        [min]="RULES.lockOut.maxAttempts.min"
                        [ngClass]="{ 'ng-invalid ng-dirty': invalid('maxAttempts') }"
                        mode="decimal"
                    />
                    @if (hasError('maxAttempts', 'required')) {
                        <small class="block mt-1 text-red-500 dark:text-red-400">El campo es requerido.</small>
                    }
                    @if (hasError('maxAttempts', 'min')) {
                        <small class="block mt-1 text-red-500 dark:text-red-400">Valor mínimo: {{ RULES.lockOut.maxAttempts.min }}</small>
                    }
                </div>

                <div class="flex flex-col gap-2">
                    <label for="lockOutTimeMinutes" class="font-bold">Tiempo de bloqueo (minutos):</label>
                    <p-inputNumber
                        inputId="lockOutTimeMinutes"
                        formControlName="lockOutTimeMinutes"
                        [min]="RULES.lockOut.lockOutTimeMinutes.min"
                        [ngClass]="{ 'ng-invalid ng-dirty': invalid('lockOutTimeMinutes') }"
                        mode="decimal"
                    />
                    @if (hasError('lockOutTimeMinutes', 'required')) {
                        <small class="block mt-1 text-red-500 dark:text-red-400">El campo es requerido.</small>
                    }
                    @if (hasError('lockOutTimeMinutes', 'min')) {
                        <small class="block mt-1 text-red-500 dark:text-red-400">Valor mínimo: {{ RULES.lockOut.lockOutTimeMinutes.min }}</small>
                    }
                </div>
            </div>
        </p-fieldset>
    `
})
export class AuthSectionComponent {
    readonly settings = input.required<LockOutSettings>();

    readonly valueChange = output<LockOutSettings>();
    readonly valid = output<boolean>();

    protected readonly RULES = SETTINGS_RULES;

    private readonly fb = inject(NonNullableFormBuilder);

    protected readonly form = this.fb.group({
        maxAttempts: [
            SETTINGS_RULES.lockOut.maxAttempts.min,
            [Validators.required, Validators.min(SETTINGS_RULES.lockOut.maxAttempts.min)]
        ],
        lockOutTimeMinutes: [
            SETTINGS_RULES.lockOut.lockOutTimeMinutes.min,
            [Validators.required, Validators.min(SETTINGS_RULES.lockOut.lockOutTimeMinutes.min)]
        ]
    });

    constructor() {
        effect(() => {
            const settings = this.settings();
            const controls = this.form.controls;
            if (controls.maxAttempts.value !== settings.maxAttempts) {
                controls.maxAttempts.setValue(settings.maxAttempts);
            }
            if (controls.lockOutTimeMinutes.value !== settings.lockOutTimeMinutes) {
                controls.lockOutTimeMinutes.setValue(settings.lockOutTimeMinutes);
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
            maxAttempts: this.form.controls.maxAttempts.value,
            lockOutTimeMinutes: this.form.controls.lockOutTimeMinutes.value
        });
        this.valid.emit(this.form.valid);
    }
}