import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { By } from '@angular/platform-browser';

import { SettingsFormDialogComponent } from './settings-form-dialog.component';
import { PasswordSectionComponent } from '../password-section/password-section.component';
import { SettingsRepository } from '../../../infrastructure/settings-repository';
import { makeSecuritySettings } from '../../../domain/security-settings';

const BASELINE = makeSecuritySettings({
    accessTokenExpireMinute: 30,
    passwordSettings: { validDays: 45, passwordDefaultValue: 'Def-p4ss', minLength: 10 }
});

function passwordSection(fixture: ComponentFixture<SettingsFormDialogComponent>): PasswordSectionComponent {
    return fixture.debugElement.query(By.css('app-password-section')).componentInstance as PasswordSectionComponent;
}

describe('SettingsFormDialogComponent', () => {
    let fixture: ComponentFixture<SettingsFormDialogComponent>;
    let component: SettingsFormDialogComponent;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [SettingsFormDialogComponent],
            providers: [
                provideZonelessChangeDetection(),
                { provide: SettingsRepository, useValue: { get: vi.fn(), save: vi.fn() } }
            ]
        });

        fixture = TestBed.createComponent(SettingsFormDialogComponent);
        component = fixture.componentInstance;
    });

    it('is not dirty and is valid once the sections seed the baseline', () => {
        fixture.componentRef.setInput('settings', BASELINE);
        fixture.detectChanges();
        TestBed.flushEffects();

        expect(component['current']()).toEqual(BASELINE);
        expect(component['dirty']()).toBe(false);
        expect(component['valid']()).toBe(true);
    });

    it('becomes dirty when a section value changes and emits saved with the assembled entity', () => {
        fixture.componentRef.setInput('settings', BASELINE);
        fixture.detectChanges();
        TestBed.flushEffects();

        passwordSection(fixture)['form'].controls.minLength.setValue(12);

        expect(component['dirty']()).toBe(true);

        const saved = vi.fn();
        component.saved.subscribe(saved);
        component['onSubmit']();

        expect(saved).toHaveBeenCalledTimes(1);
        expect(saved).toHaveBeenCalledWith(
            makeSecuritySettings({
                accessTokenExpireMinute: 30,
                passwordSettings: { validDays: 45, passwordDefaultValue: 'Def-p4ss', minLength: 12 }
            })
        );
    });

    it('does not emit saved while a section is invalid', () => {
        fixture.componentRef.setInput('settings', BASELINE);
        fixture.detectChanges();
        TestBed.flushEffects();

        // Debajo del mínimo de SETTINGS_RULES.password.minLength (8).
        passwordSection(fixture)['form'].controls.minLength.setValue(2);

        expect(component['valid']()).toBe(false);
        expect(component['current']()).not.toBeNull();

        const saved = vi.fn();
        component.saved.subscribe(saved);
        component['onSubmit']();

        expect(saved).not.toHaveBeenCalled();
    });

    it('reveals section errors on a save attempt of an invalid form (option B)', () => {
        fixture.componentRef.setInput('settings', BASELINE);
        fixture.detectChanges();
        TestBed.flushEffects();

        // Debajo del mínimo de SETTINGS_RULES.password.minLength (8).
        const section = passwordSection(fixture);
        section['form'].controls.minLength.setValue(2);

        expect(component['valid']()).toBe(false);
        expect(component['dirty']()).toBe(true);

        const saved = vi.fn();
        component.saved.subscribe(saved);
        component['onSubmit']();

        // No se guarda, pero el control quedó touched (error visible).
        expect(saved).not.toHaveBeenCalled();
        expect(section['form'].controls.minLength.touched).toBe(true);
    });
});