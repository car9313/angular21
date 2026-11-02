import { Component, computed, inject, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { Dialog } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { AuditListStore } from '@/app/modules/security/audits/presentation/stores/audit-list.store';
import { getHttpErrorMessage } from '@/app/core/utils/http-error-message';
import {
    ViewAuditSkeletonComponent
} from '@/app/modules/security/audits/presentation/components/audit-detail-dialog/view-audit-skeleton/view-audit-skeleton.component';

@Component({
    selector: 'app-audit-detail-dialog',
    imports: [Dialog, Button, DatePipe, ViewAuditSkeletonComponent],
    templateUrl: './audit-detail-dialog.html',
    styleUrl: './audit-detail-dialog.scss'
})
export class AuditDetailDialog {
    readonly store = inject(AuditListStore);
    readonly auditId = input.required<string>();
    readonly cancelled = output<void>();

    readonly auditResource = rxResource({
        params: () => this.auditId(),
        stream: ({ params: id }) => this.store.getById(id)
    });

    readonly audit = computed(() => {
        // Angular's Resource.value() THROWS while the resource is in an error
        // state (ResourceValueError); read the error first and expose null.
        if (this.auditResource.error()) return null;
        return this.auditResource.value() ?? null;
    });
    readonly loading = computed(() => this.auditResource.isLoading());
    readonly errorMsg = computed(() => {
        const err = this.auditResource.error();
        return err ? getHttpErrorMessage(err, 'No se pudo obtener los detalles correspondientes a este registro.') : null;
    });

    retryLoad(): void {
        this.auditResource.reload();
    }

    close(): void {
        this.cancelled.emit();
    }

    onVisibleChange(visible: boolean): void {
        if (!visible) this.close();
    }
}
