export interface AuditListItemDto {
    id: string;
    userName: string;
    userFullName: string;
    userHostAddress: string;
    moment: string;
    actionDescription: string;
    message: string;
}
