import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TableLazyLoadEvent } from 'primeng/table';

import { ProvinceTable } from './province-table';
import { ColumnConfig } from '@/app/core/interfaces/column-config';
import { Province } from '@/app/modules/nomenclators/provinces/domain/province';

const PINAR: Province = { code: 'PR', descShort: 'PRI', descLong: 'Pinar del Río', active: true };
const HABANA: Province = { code: 'LH', descShort: 'HAB', descLong: 'La Habana', active: false };

const COLUMNS: ColumnConfig<Province>[] = [
    { field: 'code', header: 'Código' },
    { field: 'descShort', header: 'Acrónimo' },
    { field: 'descLong', header: 'Nombre' },
    { field: 'active', header: 'Activo' }
];

describe('ProvinceTable', () => {
    let fixture: ComponentFixture<ProvinceTable>;
    let component: ProvinceTable;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ProvinceTable],
            providers: [provideZonelessChangeDetection()]
        });

        fixture = TestBed.createComponent(ProvinceTable);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('items', [PINAR, HABANA]);
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

        component.onToggleActive(PINAR, false);

        expect(emit).toHaveBeenCalledWith({ province: PINAR, active: false });
        expect(PINAR.active).toBe(true);
    });

    it('ignores toggle requests when the user cannot update or the code is in flight', () => {
        const emit = vi.fn();
        component.toggleActive.subscribe(emit);

        component.onToggleActive(PINAR, false);
        expect(emit).not.toHaveBeenCalled();

        fixture.componentRef.setInput('canToggle', true);
        fixture.componentRef.setInput('pendingCode', new Set(['PR']));
        fixture.detectChanges();

        component.onToggleActive(PINAR, false);
        expect(emit).not.toHaveBeenCalled();
        expect(component.isToggling('PR')).toBe(true);
        expect(component.isToggling('LH')).toBe(false);
    });

    it('builds a search-specific empty message', () => {
        fixture.componentRef.setInput('searchText', 'Atlántida');
        fixture.detectChanges();

        expect(component.emptySearchDescription()).toContain('Atlántida');
        expect(component.emptySearchDescription()).toContain('provincias');
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
