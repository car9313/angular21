import { Municipality, MunicipalityInput } from '@/app/modules/nomenclators/municipalities/domain/municipality';
import { MunicipalityDto, MunicipalityWriteDto } from '@/app/modules/nomenclators/municipalities/infrastructure/dtos/municipality.dto';

export class MunicipalityMapper {
    static toDomain(dto: MunicipalityDto): Municipality {
        return {
            code: dto.code,
            shortName: dto.descShort,
            name: dto.descLong,
            active: dto.active,
            provinceCode: dto.provinceCode ?? null,
            provinceName: dto.provinceDescLong ?? dto.provinceName ?? null
        };
    }

    static toWriteDto(input: MunicipalityInput): MunicipalityWriteDto {
        return {
            code: input.code,
            descShort: input.shortName,
            descLong: input.name,
            provinceCode: input.provinceCode
        };
    }
}
