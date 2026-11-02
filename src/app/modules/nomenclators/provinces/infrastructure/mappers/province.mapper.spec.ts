import { describe, it, expect } from 'vitest';

import { ProvinceMapper } from './province.mapper';
import { ProvinceDto } from '../dtos/province.dto';

const PINAR_DTO: ProvinceDto = { code: 'PR', descShort: 'PRI', descLong: 'Pinar del Río', active: true };

describe('ProvinceMapper', () => {
    it('maps descShort and descLong to the neutral domain names', () => {
        expect(ProvinceMapper.toDomain(PINAR_DTO)).toEqual({
            code: 'PR',
            shortName: 'PRI',
            name: 'Pinar del Río',
            active: true
        });
    });

    it('maps the domain input back to the wire payload', () => {
        expect(ProvinceMapper.toWriteDto({ code: 'PR', shortName: 'PRI', name: 'Pinar del Río' })).toEqual({
            code: 'PR',
            descShort: 'PRI',
            descLong: 'Pinar del Río'
        });
    });
});
