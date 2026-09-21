/**
 * Permission actions (RBAC). Values match the backend permission contract.
 */
export const ACTIONS = {
    Read: 'Read',
    Create: 'Create',
    Update: 'Update',
    Delete: 'Delete'
} as const;

export type Action = (typeof ACTIONS)[keyof typeof ACTIONS];