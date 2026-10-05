/**
 * Security settings aggregate (wire contract of the reference backend).
 *
 * Casing mirrors the .NET record: camelCase, NO "I" prefix (see Role).
 * This is the single entity a Settings screen edits; a future consumer
 * (e.g. session/inactivity expiry) reads the same payload from the root store.
 */

export interface PasswordSettings {
    validDays: number;
    historyMinCount: number;
    passwordDefaultValue: string;
    minLength: number;
    requiresUppercase: boolean;
    requiresLowercase: boolean;
    requiresDigits: boolean;
    requiresSpecialChars: boolean;
}

export interface LockOutSettings {
    maxAttempts: number;
    lockOutTimeMinutes: number;
}

export interface UserSettings {
    usernameMinLength: number;
}

export interface SecuritySettings {
    accessTokenExpireMinute: number;
    sessionExpireMinute: number;
    passwordSettings: PasswordSettings;
    lockOutSettings: LockOutSettings;
    userSettings: UserSettings;
}

/** Defaults (same values as the reference implementation). */
export const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
    accessTokenExpireMinute: 10,
    sessionExpireMinute: 5,
    passwordSettings: {
        validDays: 90,
        historyMinCount: 24,
        passwordDefaultValue: '',
        minLength: 8,
        requiresUppercase: true,
        requiresLowercase: true,
        requiresDigits: true,
        requiresSpecialChars: true
    },
    lockOutSettings: {
        maxAttempts: 5,
        lockOutTimeMinutes: 10
    },
    userSettings: {
        usernameMinLength: 5
    }
};

export interface MinRule {
    min: number;
}

export interface MinMaxRule {
    min: number;
    max: number;
}

export interface SettingsRules {
    accessTokenExpireMinute: MinRule;
    sessionExpireMinute: MinRule;
    password: {
        validDays: MinMaxRule;
        historyMinCount: MinRule;
        minLength: MinRule;
    };
    lockOut: {
        maxAttempts: MinRule;
        lockOutTimeMinutes: MinRule;
    };
    user: {
        usernameMinLength: MinRule;
    };
}

/**
 * Business validation rules, centralized in the domain so every form section
 * derives its validators from here (single source of truth, never inline).
 */
export const SETTINGS_RULES: SettingsRules = {
    accessTokenExpireMinute: { min: 1 },
    sessionExpireMinute: { min: 1 },
    password: {
        validDays: { min: 30, max: 90 },
        historyMinCount: { min: 24 },
        minLength: { min: 8 }
    },
    lockOut: {
        maxAttempts: { min: 1 },
        lockOutTimeMinutes: { min: 1 }
    },
    user: {
        usernameMinLength: { min: 3 }
    }
};

/** Typed overrides for the factory: nested groups accept partials. */
export interface SecuritySettingsOverrides {
    accessTokenExpireMinute?: number;
    sessionExpireMinute?: number;
    passwordSettings?: Partial<PasswordSettings>;
    lockOutSettings?: Partial<LockOutSettings>;
    userSettings?: Partial<UserSettings>;
}

/** Shallow-merges overrides on top of the defaults (deep for nested groups). */
export function makeSecuritySettings(overrides: SecuritySettingsOverrides = {}): SecuritySettings {
    return {
        accessTokenExpireMinute: overrides.accessTokenExpireMinute ?? DEFAULT_SECURITY_SETTINGS.accessTokenExpireMinute,
        sessionExpireMinute: overrides.sessionExpireMinute ?? DEFAULT_SECURITY_SETTINGS.sessionExpireMinute,
        passwordSettings: { ...DEFAULT_SECURITY_SETTINGS.passwordSettings, ...overrides.passwordSettings },
        lockOutSettings: { ...DEFAULT_SECURITY_SETTINGS.lockOutSettings, ...overrides.lockOutSettings },
        userSettings: { ...DEFAULT_SECURITY_SETTINGS.userSettings, ...overrides.userSettings }
    };
}

/**
 * Deterministic typed deep-equality for dirty detection.
 * Deliberately NOT JSON.stringify: key order is irrelevant here and the shape
 * of SecuritySettings is fixed, so comparing field by field is both cheaper
 * and cannot be fooled by `undefined` holes or reordered keys.
 */
export function securitySettingsEqual(a: SecuritySettings, b: SecuritySettings): boolean {
    return a.accessTokenExpireMinute === b.accessTokenExpireMinute
        && a.sessionExpireMinute === b.sessionExpireMinute
        && a.passwordSettings.validDays === b.passwordSettings.validDays
        && a.passwordSettings.historyMinCount === b.passwordSettings.historyMinCount
        && a.passwordSettings.passwordDefaultValue === b.passwordSettings.passwordDefaultValue
        && a.passwordSettings.minLength === b.passwordSettings.minLength
        && a.passwordSettings.requiresUppercase === b.passwordSettings.requiresUppercase
        && a.passwordSettings.requiresLowercase === b.passwordSettings.requiresLowercase
        && a.passwordSettings.requiresDigits === b.passwordSettings.requiresDigits
        && a.passwordSettings.requiresSpecialChars === b.passwordSettings.requiresSpecialChars
        && a.lockOutSettings.maxAttempts === b.lockOutSettings.maxAttempts
        && a.lockOutSettings.lockOutTimeMinutes === b.lockOutSettings.lockOutTimeMinutes
        && a.userSettings.usernameMinLength === b.userSettings.usernameMinLength;
}