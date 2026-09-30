import { Role } from '@/app/modules/security/roles/domain/role';


export interface User {
    id: number;
    username: string;
    fullName: string;
    isUnEditable: boolean;
    isUnDeletable: boolean;
    roles: Role[];
    password?: string;
}
