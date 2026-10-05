import { describe, it, expect } from 'vitest';
import {
    DEFAULT_SECURITY_SETTINGS,
    SETTINGS_RULES,
    makeSecuritySettings,
    securitySettingsEqual
} from './security-settings';

describe('securitySettings domain', () => {
    it('factory returns the defaults when no overrides are given', () => {
        expect(makeSecuritySettings()).toEqual(DEFAULT_SECURITY_SETTINGS);
    });

    it('factory deep-merges nested overrides on every group', () => {
        const settings = makeSecuritySettings({
            accessTokenExpireMinute: 20,
            sessionExpireMinute: 15,
            passwordSettings: { minLength: 12, requiresDigits: false },
            lockOutSettings: { maxAttempts: 3 },
            userSettings: { usernameMinLength: 6 }
        });

        expect(settings.accessTokenExpireMinute).toBe(20);
        expect(settings.sessionExpireMinute).toBe(15);
        expect(settings.passwordSettings.minLength).toBe(12);
        expect(settings.passwordSettings.requiresDigits).toBe(false);
        // Sin override: queda el default.
        expect(settings.passwordSettings.validDays).toBe(90);
        expect(settings.lockOutSettings.maxAttempts).toBe(3);
        expect(settings.lockOutSettings.lockOutTimeMinutes).toBe(10);
        expect(settings.userSettings.usernameMinLength).toBe(6);
    });

    it('securitySettingsEqual is true for structurally equal objects', () => {
        expect(securitySettingsEqual(makeSecuritySettings(), makeSecuritySettings())).toBe(true);
        expect(securitySettingsEqual(makeSecuritySettings({ sessionExpireMinute: 7 }), makeSecuritySettings({ sessionExpireMinute: 7 }))).toBe(true);
    });

    it('securitySettingsEqual detects any deep difference', () => {
        const base = makeSecuritySettings();

        expect(securitySettingsEqual(base, makeSecuritySettings({ accessTokenExpireMinute: 11 }))).toBe(false);
        expect(securitySettingsEqual(base, makeSecuritySettings({ passwordSettings: { validDays: 60 } }))).toBe(false);
        expect(securitySettingsEqual(base, makeSecuritySettings({ passwordSettings: { requiresLowercase: false } }))).toBe(false);
        expect(securitySettingsEqual(base, makeSecuritySettings({ lockOutSettings: { lockOutTimeMinutes: 5 } }))).toBe(false);
        expect(securitySettingsEqual(base, makeSecuritySettings({ userSettings: { usernameMinLength: 4 } }))).toBe(false);
    });

    it('SETTINGS_RULES carries the reference constraints', () => {
        expect(SETTINGS_RULES.accessTokenExpireMinute).toEqual({ min: 1 });
        expect(SETTINGS_RULES.sessionExpireMinute).toEqual({ min: 1 });
        expect(SETTINGS_RULES.password.validDays).toEqual({ min: 30, max: 90 });
        expect(SETTINGS_RULES.password.historyMinCount).toEqual({ min: 24 });
        expect(SETTINGS_RULES.password.minLength).toEqual({ min: 8 });
        expect(SETTINGS_RULES.lockOut.maxAttempts).toEqual({ min: 1 });
        expect(SETTINGS_RULES.lockOut.lockOutTimeMinutes).toEqual({ min: 1 });
        expect(SETTINGS_RULES.user.usernameMinLength).toEqual({ min: 3 });
    });
});