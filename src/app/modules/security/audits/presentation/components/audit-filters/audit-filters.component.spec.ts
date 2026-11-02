import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';

import { AuditFiltersComponent } from './audit-filters.component';
import { AuditListStore } from '../../stores/audit-list.store';
import { AuditRepository } from '../../../infrastructure/http/audit-repository';
import type { PaginatedResponse } from '@/app/core/interfaces/paginated-response';

const EMPTY_PAGE = (): PaginatedResponse<never> => ({
    objects: [],
    meta: { currentPage: 1, nextPage: null, prevPage: null, totalPage: 1, totalCount: 0 }
});

describe('AuditFiltersComponent', () => {
    let fixture: ComponentFixture<AuditFiltersComponent>;
    let component: AuditFiltersComponent;
    let store: InstanceType<typeof AuditListStore>;

    beforeEach(() => {
        sessionStorage.clear();

        TestBed.configureTestingModule({
            imports: [AuditFiltersComponent],
            providers: [
                AuditListStore,
                MessageService,
                {
                    provide: AuditRepository,
                    useValue: {
                        list: vi.fn(() => of(EMPTY_PAGE())),
                        getById: vi.fn(),
                        getActionTypes: vi.fn(() => of([{ id: 2, name: 'Update' }, { id: 1, name: 'Login' }]))
                    }
                }
            ]
        });

        store = TestBed.inject(AuditListStore);
        fixture = TestBed.createComponent(AuditFiltersComponent);
        component = fixture.componentInstance;
    });

    afterEach(() => {
        sessionStorage.clear();
    });

    it('syncs the form from the filters already persisted in the store', () => {
        // Lo que hace el hook de withFiltersPersistence al restaurar la query.
        store.applyFilters({ UserName: 'aruiz', Action: 3, InitDate: '2026-10-01', EndDate: '2026-10-05' });

        fixture.detectChanges(); // ngOnInit

        expect(component.form.getRawValue()).toEqual({
            UserName: 'aruiz',
            UserFullName: '',
            UserHostAddress: '',
            Action: 3,
            InitDate: new Date(2026, 9, 1),
            EndDate: new Date(2026, 9, 5)
        });
        expect(component.hasFormFilters()).toBe(true);
    });

    it('loads the action catalog sorted by id on init', () => {
        fixture.detectChanges();

        expect(component.actionOptions()).toEqual([
            { id: 1, name: 'Login' },
            { id: 2, name: 'Update' }
        ]);
    });

    it('serializes the form into store filters on submit (dates to ISO, numbers to string)', () => {
        fixture.detectChanges();

        component.form.patchValue({ UserName: 'aruiz', Action: 1, InitDate: new Date(2026, 9, 1) });
        component.onSubmit();

        expect(store.query().filter).toEqual([
            { PropertyName: 'UserName', PropertyValue: 'aruiz' },
            { PropertyName: 'Action', PropertyValue: '1' },
            { PropertyName: 'InitDate', PropertyValue: '2026-10-01' }
        ]);
        expect(store.query().pag.Page).toBe(1);
    });

    it('clears both the form and the store filters on reset', () => {
        fixture.detectChanges();

        component.form.patchValue({ UserName: 'aruiz' });
        component.onSubmit();
        expect(store.hasActiveFilters()).toBe(true);

        component.onReset();

        expect(store.hasActiveFilters()).toBe(false);
        expect(component.form.getRawValue().UserName).toBe('');
        expect(component.hasFormFilters()).toBe(false);
    });

    it('enables the apply button only when the form carries a value', () => {
        fixture.detectChanges();

        expect(component.hasFormFilters()).toBe(false);

        component.form.patchValue({ UserFullName: 'Ana' });
        expect(component.hasFormFilters()).toBe(true);

        component.form.reset();
        expect(component.hasFormFilters()).toBe(false);
    });
});
