/**
 * Write DTOs of /api/users (wire contract of the reference backend).
 * Casing: `userName` en el alta (N mayúscula, como el .NET record);
 * el UPDATE no lleva username (no se edita).
 */
export interface UserCreateDto {
    userName: string;
    fullName: string;
    password?: string;
    passwordConfirmation?: string;
    roleIds: number[];
}

export interface UserUpdateDto {
    fullName: string;
    password?: string | null;
    passwordConfirmation?: string | null;
    roleIds: number[];
}
