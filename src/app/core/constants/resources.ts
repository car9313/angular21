/**
 * RBAC resources. Single source of truth to avoid typos across menu, guards,
 * directives and feature modules.
 */
export const RESOURCES = {
    Nomenclators: 'Nomenclators',
    Roles: 'Role',
    Users: 'User',
    SecConfig: 'SecConfig',
    Audits: 'Audit'
} as const;

export type Resource = (typeof RESOURCES)[keyof typeof RESOURCES];
