import { describe, it, expect } from 'vitest';

import { CountryMapper } from './country.mapper';
import { CountryDto } from '../dtos/country.dto';

const CUBA_DTO: CountryDto = { code: 'CU', name: 'Cuba', active: true, isUnitedState: false };

describe('CountryMapper', () => {
    it('maps the wire DTO to the domain without leaking backend-only fields', () => {
        const country = CountryMapper.toDomain(CUBA_DTO);

        expect(country).toEqual({ code: 'CU', name: 'Cuba', active: true });
        expect(country).not.toHaveProperty('isUnitedState');
    });

    it('maps the domain input to the write DTO', () => {
        expect(CountryMapper.toWriteDto({ code: 'CU', name: 'Cuba' })).toEqual({ code: 'CU', name: 'Cuba' });
    });
});
