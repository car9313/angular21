/**
 * Role aggregate (wire contract of the reference backend).
 * Casing mirrors the .NET record: Id, Name, IsUnEditable, IsUnDeletable,
 * Permissions.
 */
export interface Role {
    id: number;
    name: string;
    isUnEditable: boolean;
    isUnDeletable: boolean;
    permissions: PermissionDto[];
}

/** A resource permission as the roles API returns it. */
export interface PermissionDto {
    resource: string;
    description: string;
    actions: string[];
}

/** Category of permissions returned by GET /api/roles/permissions. */
export interface AppPermissionsCategory {
    category: string;
    permissions: PermissionDto[];
}