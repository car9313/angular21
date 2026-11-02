import { Province, ProvinceInput } from '@/app/modules/nomenclators/provinces/domain/province';
import { ProvinceDto, ProvinceWriteDto } from '@/app/modules/nomenclators/provinces/infrastructure/dtos/province.dto';

export class ProvinceMapper {
    static toDomain(dto: ProvinceDto): Province {
        return {
            code: dto.code,
            shortName: dto.descShort,
            name: dto.descLong,
            active: dto.active
        };
    }

    static toWriteDto(input: ProvinceInput): ProvinceWriteDto {
        return {
            code: input.code,
            descShort: input.shortName,
            descLong: input.name
        };
    }
}
