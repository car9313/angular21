import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { ColumnConfig } from '@/app/core/interfaces/column-config';
import { AuditListStore } from '@/app/modules/security/audits/presentation/stores/audit-list.store';
import { Audit } from '@/app/modules/security/audits/domain/audit';
import { formatDateTimeForDisplay } from '@/app/core/helpers/date-mapper.helper';
import { TableAction } from '@/app/core/interfaces/table-action';
import { RESOURCES } from '@/app/core/constants/resources';
import { ACTIONS } from '@/app/core/constants/actions';
import { AuditTable } from '@/app/modules/security/audits/presentation/components/audit-table/audit-table';
import {
    AuditDetailDialog
} from '@/app/modules/security/audits/presentation/components/audit-detail-dialog/audit-detail-dialog';
import { AuditFiltersComponent } from '@/app/modules/security/audits/presentation/components/audit-filters/audit-filters.component';
import { ToolbarComponent } from '@/app/shared/components/generictToolbar/toolbar.component';
import { SearchComponent } from '@/app/shared/components/search/search.component';
import { handlePageChange } from '@/app/core/helpers/page-change.helper';
import { PageChangeEvent } from '@/app/core/interfaces/page-change-event';

@Component({
    selector: 'app-audit',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [AuditTable, AuditDetailDialog, AuditFiltersComponent, ToolbarComponent, SearchComponent],
    providers: [AuditListStore],
    template: `
        @if (store.modalMode() === 'detail') {
            @if (store.selectedId(); as auditId) {
                <app-audit-detail-dialog [auditId]="auditId!" (cancelled)="store.closeModalAndClearSelection()" />
            }
        }

        <div class="card flex flex-col gap-8">
            <app-toolbar [resource]="RESOURCES.Audits" [actions]="[]" [config]="{ visible: true, showAddButton: false }">
                <div toolbar-end>
                    <app-search [searchText]="store.searchText()" (searchSubmitted)="store.setSearchAndReload($event)"></app-search>
                </div>
            </app-toolbar>

            <app-audit-filters />

            <app-audit-table
                [items]="items()"
                [columns]="columns"
                [rowActions]="rowActions()"
                [selectedId]="store.selectedId()"
                [loading]="store.loading()"
                [error]="store.error()"
                [totalRecords]="store.meta().totalCount"
                [currentPage]="store.currentPage()"
                [pageSize]="store.pageSize()"
                [searchText]="store.searchText()"
                (selectRow)="store.select($event.id)"
                (pageChange)="onPageChange($event)"
            />
        </div>
    `
})
export class AuditPage implements OnInit {
    readonly store = inject(AuditListStore);
    readonly columns: ColumnConfig<Audit>[] = [
        { field: 'id', header: 'ID', className: 'text-center' },
        { field: 'userName', header: 'Usuario' },
        { field: 'userFullName', header: 'Nombre' },
        { field: 'userHostAddress', header: 'Dirección IP' },
        { field: 'moment', header: 'Fecha', cellTemplate: (a) => formatDateTimeForDisplay(a.moment) },
        { field: 'actionDescription', header: 'Acción' }
    ];

    readonly items = computed(() => this.store.entities());

    readonly rowActions = computed<TableAction<Audit>[]>(() => [
        {
            label: 'Ver Detalles',
            icon: 'pi pi-eye',
            permission: { resource: RESOURCES.Audits, action: ACTIONS.Read },
            command: (row) => this.store.openDetail(row)
        }
    ]);

    ngOnInit(): void {
        this.store.load();
    }

    protected readonly RESOURCES = RESOURCES;

    onPageChange(e: PageChangeEvent): void {
        handlePageChange(this.store, e);
    }
}
