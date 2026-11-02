import { Country, CountryInput } from '@/app/modules/nomenclators/countries/domain/country';
import { CountryDto, CountryWriteDto } from '@/app/modules/nomenclators/countries/infrastructure/dtos/country.dto';

export class CountryMapper {
    static toDomain(dto: CountryDto): Country {
        return {
            code: dto.code,
            name: dto.name,
            active: dto.active
        };
    }

    static toWriteDto(input: CountryInput): CountryWriteDto {
        return {
            code: input.code,
            name: input.name
        };
    }
}
