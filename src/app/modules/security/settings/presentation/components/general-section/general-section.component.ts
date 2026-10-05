// src/app/modules/security/settings/presentation/components/general-section/general-section.component.ts
import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgClass } from '@angular/common';
import { FieldsetModule } from 'primeng/fieldset';
import { InputNumberModule } from 'primeng/inputnumber';

import { SETTINGS_RULES } from '../../../domain/security-settings';

/** Typed slice of SecuritySettings owned by this section. */
export interface GeneralSettingsSlice {
    accessTokenExpireMinute: number;
    sessionExpireMinute: number;
}

/**
 * Presentational section: owns its OWN FormGroup for the general settings.
 *
 * - Seed: input -> form via effect (guarded per control so user edits are
 *   never overwritten). Subscribe ONCE in the constructor (never per change).
 * - Validators derive from SETTINGS_RULES: single source of truth for the
 *   business constraints.
 * - Every form change emits the typed slice + validity; the dialog assembles
 *   the master SecuritySettings from the four sections.
 */
@Component({
    selector: 'app-general-section',
    standalone: true,
    imports: [ReactiveFormsModule, NgClass, FieldsetModule, InputNumberModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <p-fieldset legend="Configuración general" toggleable="true">
            <div [formGroup]="form" class="grid grid-cols-2 gap-5">
                <div class="flex flex-col gap-2">
                    <label for="accessTokenExpireMinute" class="font-bold">Tiempo de validez de token (minutos):</label>
                    <p-inputNumber
                        inputId="accessTokenExpireMinute"
                        formControlName="accessTokenExpireMinute"
                        [min]="RULES.accessTokenExpireMinute.min"
                        [ngClass]="{ 'ng-invalid ng-dirty': invalid('accessTokenExpireMinute') }"
                        mode="decimal"
                    />
                    @if (hasError('accessTokenExpireMinute', 'required')) {
                        <small class="block mt-1 text-red-500 dark:text-red-400">El campo es requerido.</small>
                    }
                    @if (hasError('accessTokenExpireMinute', 'min')) {
                        <small class="block mt-1 text-red-500 dark:text-red-400">Valor mínimo: {{ RULES.accessTokenExpireMinute.min }}</small>
                    }
                </div>

                <div class="flex flex-col gap-2">
                    <label for="sessionExpireMinute" class="font-bold">Tiempo de inactividad de sesión (minutos):</label>
                    <p-inputNumber
                        inputId="sessionExpireMinute"
                        formControlName="sessionExpireMinute"
                        [min]="RULES.sessionExpireMinute.min"
                        [ngClass]="{ 'ng-invalid ng-dirty': invalid('sessionExpireMinute') }"
                        mode="decimal"
                    />
                    @if (hasError('sessionExpireMinute', 'required')) {
                        <small class="block mt-1 text-red-500 dark:text-red-400">El campo es requerido.</small>
                    }
                    @if (hasError('sessionExpireMinute', 'min')) {
                        <small class="block mt-1 text-red-500 dark:text-red-400">Valor mínimo: {{ RULES.sessionExpireMinute.min }}</small>
                    }
                </div>
            </div>
        </p-fieldset>
    `
})
export class GeneralSectionComponent {
    readonly settings = input.required<GeneralSettingsSlice>();

    readonly valueChange = output<GeneralSettingsSlice>();
    readonly valid = output<boolean>();

    protected readonly RULES = SETTINGS_RULES;

    private readonly fb = inject(NonNullableFormBuilder);

    protected readonly form = this.fb.group({
        accessTokenExpireMinute: [
            SETTINGS_RULES.accessTokenExpireMinute.min,
            [Validators.required, Validators.min(SETTINGS_RULES.accessTokenExpireMinute.min)]
        ],
        sessionExpireMinute: [
            SETTINGS_RULES.sessionExpireMinute.min,
            [Validators.required, Validators.min(SETTINGS_RULES.sessionExpireMinute.min)]
        ]
    });

    constructor() {
        // Seed input -> form. Guarded: only writes when the value actually
        // differs, so the effect never clobbers user edits on re-runs.
        effect(() => {
            const settings = this.settings();
            const controls = this.form.controls;
            if (controls.accessTokenExpireMinute.value !== settings.accessTokenExpireMinute) {
                controls.accessTokenExpireMinute.setValue(settings.accessTokenExpireMinute);
            }
            if (controls.sessionExpireMinute.value !== settings.sessionExpireMinute) {
                controls.sessionExpireMinute.setValue(settings.sessionExpireMinute);
            }
        });

        // Subscribe ONCE per form — accumulated subscriptions were a
        // reference bug (valueChanges.subscribe inside ngOnChanges).
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
            accessTokenExpireMinute: this.form.controls.accessTokenExpireMinute.value,
            sessionExpireMinute: this.form.controls.sessionExpireMinute.value
        });
        this.valid.emit(this.form.valid);
    }
}