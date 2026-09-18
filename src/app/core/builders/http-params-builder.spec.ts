import { describe, it, expect } from 'vitest';
import { HttpParamsBuilder } from './http-params-builder';
import { defaultQuery, QueryParams } from '../interfaces/query-params';

describe('HttpParamsBuilder', () => {
    it('builds an empty HttpParams by default', () => {
        const params = new HttpParamsBuilder().build();

        expect(params.keys()).toEqual([]);
    });

    it('later calls overwrite earlier values for the same key', () => {
        const params = new HttpParamsBuilder().withPagination(1, 10).withPagination(2, 20).build();

        expect(params.get('Pag.Page')).toBe('2');
        expect(params.get('Pag.PageSize')).toBe('20');
    });

    it('sets Pag.Page and Pag.PageSize', () => {
        const params = new HttpParamsBuilder().withPagination(3, 25).build();

        expect(params.get('Pag.Page')).toBe('3');
        expect(params.get('Pag.PageSize')).toBe('25');
    });

    it('omits pagination when values are nullish', () => {
        const params = new HttpParamsBuilder().withPagination(undefined, undefined).build();

        expect(params.keys()).toEqual([]);
    });

    it('sets trimmed Search.SearchText and Search.Strict', () => {
        const params = new HttpParamsBuilder().withSearch('  juan  ', true).build();

        expect(params.get('Search.SearchText')).toBe('juan');
        expect(params.get('Search.Strict')).toBe('true');
    });

    it('omits search params when text is blank', () => {
        const params = new HttpParamsBuilder().withSearch('   ').build();

        expect(params.keys()).toEqual([]);
    });

    it('serializes filters into a single JSON Filter param', () => {
        const filters = [
            { PropertyName: 'ProvinceId', PropertyValue: '4' },
            { PropertyName: 'Status', PropertyValue: 'approved' }
        ];

        const params = new HttpParamsBuilder().withFilters(filters).build();

        expect(params.get('Filter')).toBe(JSON.stringify(filters));
    });

    it('omits Filter when the list is empty', () => {
        const params = new HttpParamsBuilder().withFilters([]).build();

        expect(params.keys()).toEqual([]);
    });

    it('sets Sort[i].SortBy and Sort[i].Ascending', () => {
        const sort = [
            { SortBy: 'LastName', Ascending: true },
            { SortBy: 'FirstName', Ascending: false }
        ];

        const params = new HttpParamsBuilder().withSort(sort).build();

        expect(params.get('Sort[0].SortBy')).toBe('LastName');
        expect(params.get('Sort[0].Ascending')).toBe('true');
        expect(params.get('Sort[1].SortBy')).toBe('FirstName');
        expect(params.get('Sort[1].Ascending')).toBe('false');
    });

    it('applies every slice from a full QueryParams via withQueryParams', () => {
        const query: QueryParams = {
            search: { SearchText: 'ana', Strict: false },
            filter: [{ PropertyName: 'CityId', PropertyValue: '9' }],
            sort: [{ SortBy: 'Name', Ascending: true }],
            pag: { Page: 2, PageSize: 50 }
        };

        const params = new HttpParamsBuilder().withQueryParams(query).build();

        expect(params.get('Pag.Page')).toBe('2');
        expect(params.get('Pag.PageSize')).toBe('50');
        expect(params.get('Search.SearchText')).toBe('ana');
        expect(params.get('Search.Strict')).toBe('false');
        expect(params.get('Filter')).toBe(JSON.stringify(query.filter));
        expect(params.get('Sort[0].SortBy')).toBe('Name');
    });

    it('builds the full HttpParams from a complete QueryParams via the static helper', () => {
        const query: QueryParams = {
            search: { SearchText: 'ana', Strict: false },
            pag: { Page: 1, PageSize: 10 }
        };

        const params = HttpParamsBuilder.fromQuery(query);

        expect(params.get('Pag.Page')).toBe('1');
        expect(params.get('Pag.PageSize')).toBe('10');
        expect(params.get('Search.SearchText')).toBe('ana');
    });

    it('defaultQuery returns a fresh, immutable-by-convention object each call', () => {
        const first = defaultQuery();
        const second = defaultQuery();

        expect(first).not.toBe(second);
        expect(first.pag).toEqual({ Page: 1, PageSize: 10 });
        expect(first.search).toEqual({ SearchText: '', Strict: false });
        expect(first.filter).toEqual([]);
        expect(first.sort).toEqual([]);
    });
});
