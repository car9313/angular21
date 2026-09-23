import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TableLazyLoadEvent } from 'primeng/table';
import { BaseTableComponent } from '../../../../shared/components/base-table/base-table.component';
import { QueryParams } from '../../../../core/interfaces/query-params';
import { RoleListStore } from './stores/role-list.store';

/**
 * Roles list screen (Fase 2.5a): lazy paginated table backed by RoleListStore.
 * The store is provided HERE (not root) so its state lives and dies with this
 * route — no cross-screen leakage.
 */
@Component({
    selector: 'app-roles',
    standalone: true,
    imports: [BaseTableComponent],
    providers: [RoleListStore],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <app-base-table
            [items]="store.entities()"
            [loading]="store.loading()"
            [totalRecords]="store.total()"
            [paginated]="true"
            [stripedRows]="true"
            [dataKey]="'id'"
            [showCurrentPageReport]="true"
            (lazyLoad)="onLazyLoad($event)"
            emptyTitle="No hay roles"
            emptyDescription="Aún no existen roles registrados."
        >
            <ng-template #header>
                <div class="flex items-center gap-2">
                    <span class="font-semibold">Roles</span>
                </div>
            </ng-template>

            <ng-template #body let-item>
                <td>{{ item.name }}</td>
                <td>
                    @if (item.isUnEditable) {
                        <span class="inline-flex align-items-center justify-content-center bg-primary text-primary-contrast border-round px-2 py-1 text-sm">Protegido</span>
                    } @else {
                        <span class="text-muted-color">Editable</span>
                    }
                </td>
            </ng-template>
        </app-base-table>
    `
})
export class RolesPage {
    readonly store = inject(RoleListStore);

    readonly items = this.store.entities;
    readonly loading = this.store.loading;
    readonly total = this.store.total;

    onLazyLoad(event: TableLazyLoadEvent): void {
        const query: QueryParams = {
            search: { SearchText: typeof event.globalFilter === 'string' ? event.globalFilter : '', Strict: false },
            filter: [],
            sort: [],
            pag: { Page: (event.first ?? 0) / (event.rows ?? 10) + 1, PageSize: event.rows ?? 10 }
        };

        this.store.load(query);
    }
}