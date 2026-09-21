/**
 * RBAC resources. Single source of truth to avoid typos across menu, guards,
 * directives and feature modules.
 */
export const RESOURCES = {
    Panel: 'panel',
    Users: 'users',
    Roles: 'roles',
    Audits: 'audits',
    Settings: 'settings'
} as const;

export type Resource = (typeof RESOURCES)[keyof typeof RESOURCES];