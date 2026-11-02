import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed, type ComponentFixture } from '@angular/core/testing';

import { AuditTable } from './audit-table';
import { PageChangeEvent } from '@/app/core/interfaces/page-change-event';
import { Audit } from '../../../domain/audit';

const COLUMNS = [
    { field: 'id' as const, header: 'ID' },
    { field: 'userName' as const, header: 'Usuario' }
];

const AUDIT: Audit = {
    id: 'a1',
    userName: 'aruiz',
    userFullName: 'Ana Ruiz',
    userHostAddress: '10.0.0.1',
    moment: '2026-10-01T10:00:00',
    actionDescription: 'Login',
    message: 'ok'
};

describe('AuditTable', () => {
    let component: AuditTable;
    let fixture: ComponentFixture<AuditTable>;

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [AuditTable] });
        fixture = TestBed.createComponent(AuditTable);
        fixture.componentRef.setInput('items', [AUDIT]);
        fixture.componentRef.setInput('columns', COLUMNS);
        component = fixture.componentInstance;
    });

    it('hides the page-size selector when every row fits in the current page', () => {
        fixture.componentRef.setInput('totalRecords', 7);
        fixture.componentRef.setInput('pageSize', 10);

        expect(component.visibleRowsPerPageOptions()).toBeUndefined();
    });

    it('shows the page-size selector when there is more than one page', () => {
        fixture.componentRef.setInput('totalRecords', 12);
        fixture.componentRef.setInput('pageSize', 5);

        expect(component.visibleRowsPerPageOptions()).toEqual([5, 10, 20]);
    });

    it('emits pageChange when the lazy event points to another page', () => {
        fixture.componentRef.setInput('currentPage', 1);
        fixture.componentRef.setInput('pageSize', 5);
        const emitted: PageChangeEvent[] = [];
        component.pageChange.subscribe((e) => emitted.push(e));

        component.onLazyLoad({ first: 5, rows: 5 });

        expect(emitted).toEqual([{ page: 2, pageSize: 5 }]);
    });

    it('does not emit pageChange when page and pageSize are unchanged', () => {
        fixture.componentRef.setInput('currentPage', 1);
        fixture.componentRef.setInput('pageSize', 5);
        const spy = vi.fn();
        component.pageChange.subscribe(spy);

        component.onLazyLoad({ first: 0, rows: 5 });

        expect(spy).not.toHaveBeenCalled();
    });

    it('derives the empty-search copy from the active search text', () => {
        fixture.componentRef.setInput('searchText', 'aruiz');

        expect(component.emptySearchDescription()).toContain('«aruiz»');
    });

    it('has no action column when no row action is granted', () => {
        expect(component.hasActionColumn()).toBe(false);
    });
});
