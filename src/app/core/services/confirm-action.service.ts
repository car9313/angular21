import { inject, Injectable } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { NotificationService } from '@/app/core/services/notification-services';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ConfirmActionService {
    private readonly confirm = inject(ConfirmationService);
    private readonly notify = inject(NotificationService);

    confirmAction<T>(opts: { message: string; header?: string; icon?: string; acceptLabel: string; acceptSeverity?: 'primary' | 'danger' | 'secondary'; successMessage: string; action: () => Observable<T> }): void {
        this.confirm.confirm({
            message: opts.message,
            header: opts.header ?? 'Confirmar',
            icon: opts.icon ?? 'pi pi-exclamation-triangle',
            acceptButtonProps: { label: opts.acceptLabel, severity: opts.acceptSeverity ?? 'primary' },
            rejectButtonProps: { label: 'Cancelar', severity: 'secondary', text: true },
            accept: () => {
                opts.action().subscribe({
                    next: () => this.notify.show('success', opts.successMessage),
                    error: (e: unknown) => this.notify.handleGenericError(e)
                });
            }
        });
    }
}
