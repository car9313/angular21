import { AuditListItemDto } from '@/app/modules/security/audits/infrastructure/dtos/audit-list-item.dto';
import { Audit } from '@/app/modules/security/audits/domain/audit';

export class AuditMapper {
    static toDomain(dto: AuditListItemDto): Audit {
        return {
            id: dto.id,
            userName: dto.userName,
            userFullName: dto.userFullName,
            userHostAddress: dto.userHostAddress,
            moment: new Date(dto.moment),
            actionDescription: dto.actionDescription,
            message: dto.message
        };
    }
}
