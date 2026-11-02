import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TableLazyLoadEvent } from 'primeng/table';

import { CountryTable } from './country-table';
import { ColumnConfig } from '@/app/core/interfaces/column-config';
import { Country } from '@/app/modules/nomenclators/countries/domain/country';

const CUBA: Country = { id: 1, name: 'Cuba', code: 'CU', active: true };
const SPAIN: Country = { id: 2, name: 'España', code: 'ES', active: false };

const COLUMNS: ColumnConfig<Country>[] = [
    { field: 'name', header: 'Nombre' },
    { field: 'code', header: 'Código' },
    { field: 'active', header: 'Activo' }
];

describe('CountryTable', () => {
    let fixture: ComponentFixture<CountryTable>;
    let component: CountryTable;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [CountryTable],
            providers: [provideZonelessChangeDetection()]
        });

        fixture = TestBed.createComponent(CountryTable);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('items', [CUBA, SPAIN]);
        fixture.componentRef.setInput('columns', COLUMNS);
        fixture.componentRef.setInput('pageSize', 5);
        fixture.detectChanges();
    });

    it('emits a page change only when the page or page size actually changes', () => {
        const emit = vi.fn();
        component.pageChange.subscribe(emit);

        component.onLazyLoad({ first: 0, rows: 5 } as TableLazyLoadEvent);
        expect(emit).not.toHaveBeenCalled();

        component.onLazyLoad({ first: 5, rows: 5 } as TableLazyLoadEvent);
        expect(emit).toHaveBeenCalledWith({ page: 2, pageSize: 5 });

        component.onLazyLoad({ first: 0, rows: 10 } as TableLazyLoadEvent);
        expect(emit).toHaveBeenLastCalledWith({ page: 1, pageSize: 10 });
    });

    it('emits the requested active state without mutating the entity', () => {
        const emit = vi.fn();
        component.toggleActive.subscribe(emit);
        fixture.componentRef.setInput('canToggle', true);
        fixture.detectChanges();

        component.onToggleActive(CUBA, false);

        expect(emit).toHaveBeenCalledWith({ country: CUBA, active: false });
        expect(CUBA.active).toBe(true);
    });

    it('ignores toggle requests when the user cannot update or the code is in flight', () => {
        const emit = vi.fn();
        component.toggleActive.subscribe(emit);

        component.onToggleActive(CUBA, false);
        expect(emit).not.toHaveBeenCalled();

        fixture.componentRef.setInput('canToggle', true);
        fixture.componentRef.setInput('pendingCode', new Set(['CU']));
        fixture.detectChanges();

        component.onToggleActive(CUBA, false);
        expect(emit).not.toHaveBeenCalled();
        expect(component.isToggling('CU')).toBe(true);
        expect(component.isToggling('ES')).toBe(false);
    });

    it('builds a search-specific empty message', () => {
        fixture.componentRef.setInput('searchText', 'Atlántida');
        fixture.detectChanges();

        expect(component.emptySearchDescription()).toContain('Atlántida');
        expect(component.emptySearchDescription()).toContain('países');
    });

    it('hides the rows-per-page selector when everything fits on one page', () => {
        fixture.componentRef.setInput('totalRecords', 2);
        fixture.componentRef.setInput('pageSize', 5);
        fixture.detectChanges();

        expect(component.visibleRowsPerPageOptions()).toBeUndefined();

        fixture.componentRef.setInput('totalRecords', 25);
        fixture.detectChanges();

        expect(component.visibleRowsPerPageOptions()).toEqual([5, 10, 20]);
    });
});
