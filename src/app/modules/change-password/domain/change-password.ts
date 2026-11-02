export interface ChangePassword {
    oldPassword?: string;
    newPassword: string;
    newPasswordConfirm: string;
    token?: string;
}
