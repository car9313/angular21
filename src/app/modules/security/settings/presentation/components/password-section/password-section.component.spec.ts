import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { PasswordSectionComponent } from './password-section.component';
import { makeSecuritySettings } from '../../../domain/security-settings';

const PASSWORD_SETTINGS = makeSecuritySettings({
    passwordSettings: {
        validDays: 45,
        historyMinCount: 30,
        passwordDefaultValue: 'sup3r-secreto',
        minLength: 10,
        requiresUppercase: true,
        requiresLowercase: false,
        requiresDigits: true,
        requiresSpecialChars: false
    }
}).passwordSettings;

describe('PasswordSectionComponent', () => {
    let fixture: ComponentFixture<PasswordSectionComponent>;
    let component: PasswordSectionComponent;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [PasswordSectionComponent],
            providers: [provideZonelessChangeDetection()]
        });

        fixture = TestBed.createComponent(PasswordSectionComponent);
        component = fixture.componentInstance;
    });

    it('seeds every control from the settings input', () => {
        fixture.componentRef.setInput('settings', PASSWORD_SETTINGS);
        fixture.detectChanges();
        TestBed.flushEffects();

        const controls = component['form'].controls;
        expect(controls.validDays.value).toBe(45);
        expect(controls.historyMinCount.value).toBe(30);
        expect(controls.passwordDefaultValue.value).toBe('sup3r-secreto');
        expect(controls.minLength.value).toBe(10);
        expect(controls.requiresUppercase.value).toBe(true);
        expect(controls.requiresLowercase.value).toBe(false);
        expect(controls.requiresDigits.value).toBe(true);
        expect(controls.requiresSpecialChars.value).toBe(false);
    });

    it('applies the SETTINGS_RULES validators (rejects values below the mins)', () => {
        fixture.componentRef.setInput('settings', PASSWORD_SETTINGS);
        fixture.detectChanges();
        TestBed.flushEffects();

        const controls = component['form'].controls;
        controls.validDays.setValue(10); // min 30
        controls.historyMinCount.setValue(1); // min 24
        controls.minLength.setValue(4); // min 8

        expect(controls.validDays.hasError('min')).toBe(true);
        expect(controls.validDays.hasError('max')).toBe(false);
        expect(controls.historyMinCount.hasError('min')).toBe(true);
        expect(controls.minLength.hasError('min')).toBe(true);
        expect(component['form'].valid).toBe(false);
    });

    it('rejects values above the validDays max', () => {
        fixture.componentRef.setInput('settings', PASSWORD_SETTINGS);
        fixture.detectChanges();
        TestBed.flushEffects();

        const control = component['form'].controls.validDays;
        control.setValue(200); // max 90

        expect(control.hasError('max')).toBe(true);
    });

    it('emits valueChange and valid on every form change', () => {
        fixture.componentRef.setInput('settings', PASSWORD_SETTINGS);
        fixture.detectChanges();
        TestBed.flushEffects();

        const valueChange = vi.fn();
        const valid = vi.fn();
        component.valueChange.subscribe(valueChange);
        component.valid.subscribe(valid);

        component['form'].controls.minLength.setValue(12);

        expect(valueChange).toHaveBeenCalledTimes(1);
        expect(valueChange).toHaveBeenCalledWith(expect.objectContaining({ minLength: 12 }));
        expect(valid).toHaveBeenCalledTimes(1);
        expect(valid).toHaveBeenLastCalledWith(true);
    });
});