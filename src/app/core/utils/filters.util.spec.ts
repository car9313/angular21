import { describe, it, expect } from 'vitest';

import { buildFilters, filtersToObject, hasActiveFilters } from './filters.util';

describe('filters.util', () => {
    describe('buildFilters', () => {
        it('keeps defined values and skips null, undefined and empty strings', () => {
            const filters = buildFilters({
                name: 'Cuba',
                code: '',
                active: null,
                province: undefined,
                id: 0
            });

            expect(filters).toEqual([
                { PropertyName: 'name', PropertyValue: 'Cuba' },
                { PropertyName: 'id', PropertyValue: '0' }
            ]);
        });

        it('serializes Date values as YYYY-MM-DD in local time', () => {
            const filters = buildFilters({ from: new Date(2026, 0, 5) });

            expect(filters).toEqual([{ PropertyName: 'from', PropertyValue: '2026-01-05' }]);
        });

        it('returns an empty list when there is nothing to filter', () => {
            expect(buildFilters({ a: '', b: null })).toEqual([]);
        });
    });

    describe('filtersToObject', () => {
        it('flattens the filter list into a plain object', () => {
            expect(
                filtersToObject([
                    { PropertyName: 'name', PropertyValue: 'Cuba' },
                    { PropertyName: 'code', PropertyValue: 'CU' }
                ])
            ).toEqual({ name: 'Cuba', code: 'CU' });
        });

        it('treats undefined as no filters', () => {
            expect(filtersToObject(undefined)).toEqual({});
        });
    });

    describe('hasActiveFilters', () => {
        it('is true only when at least one filter is present', () => {
            expect(hasActiveFilters([{ PropertyName: 'name', PropertyValue: 'Cuba' }])).toBe(true);
            expect(hasActiveFilters([])).toBe(false);
            expect(hasActiveFilters(undefined)).toBe(false);
        });
    });
});
