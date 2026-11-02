import { describe, it, expect } from 'vitest';

import { MunicipalityMapper } from './municipality.mapper';
import { MunicipalityDto } from '../dtos/municipality.dto';

const CONSOLACION_DTO: MunicipalityDto = {
    code: 'MC1',
    descShort: 'CON',
    descLong: 'Consolación del Sur',
    active: true,
    provinceCode: 'PR',
    provinceDescLong: 'Pinar del Río'
};

describe('MunicipalityMapper', () => {
    it('maps the wire DTO to the neutral domain model', () => {
        expect(MunicipalityMapper.toDomain(CONSOLACION_DTO)).toEqual({
            code: 'MC1',
            shortName: 'CON',
            name: 'Consolación del Sur',
            active: true,
            provinceCode: 'PR',
            provinceName: 'Pinar del Río'
        });
    });

    it('accepts provinceName as an alternative to provinceDescLong', () => {
        expect(MunicipalityMapper.toDomain({ ...CONSOLACION_DTO, provinceDescLong: null, provinceName: 'Pinar del Río' }).provinceName).toBe('Pinar del Río');
    });

    it('leaves the province empty when the backend does not send it yet', () => {
        const municipality = MunicipalityMapper.toDomain({
            code: 'MC1',
            descShort: 'CON',
            descLong: 'Consolación del Sur',
            active: true
        });

        expect(municipality).toMatchObject({ provinceCode: null, provinceName: null });
    });

    it('always sends provinceCode when writing', () => {
        expect(MunicipalityMapper.toWriteDto({ code: 'MC1', shortName: 'CON', name: 'Consolación del Sur', provinceCode: 'PR' })).toEqual({
            code: 'MC1',
            descShort: 'CON',
            descLong: 'Consolación del Sur',
            provinceCode: 'PR'
        });
    });
});
