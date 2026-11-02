import { describe, it, expect } from 'vitest';

import { findSelected } from './table.helpers';

interface Row {
    id: number;
    name: string;
}

const ROWS: Row[] = [
    { id: 1, name: 'Uno' },
    { id: 2, name: 'Dos' }
];

const getId = (row: Row): number => row.id;

describe('findSelected', () => {
    it('returns the matching item by id', () => {
        expect(findSelected(ROWS, 2, getId)).toEqual({ id: 2, name: 'Dos' });
    });

    it('returns null when the id is absent, empty or unknown', () => {
        expect(findSelected(ROWS, null, getId)).toBeNull();
        expect(findSelected(ROWS, undefined, getId)).toBeNull();
        expect(findSelected(ROWS, 99, getId)).toBeNull();
    });

    it('supports string ids and treats the empty string as no selection', () => {
        const items = [{ code: 'CU' }, { code: 'ES' }];

        expect(findSelected(items, 'ES', (item) => item.code)).toEqual({ code: 'ES' });
        expect(findSelected(items, '', (item) => item.code)).toBeNull();
    });

    it('accepts 0 as a valid id', () => {
        const items = [
            { id: 0, name: 'Cero' },
            { id: 1, name: 'Uno' }
        ];

        expect(findSelected(items, 0, getId)).toEqual({ id: 0, name: 'Cero' });
    });
});
