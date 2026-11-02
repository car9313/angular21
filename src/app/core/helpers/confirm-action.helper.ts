import { ConfirmationService } from 'primeng/api';
import { Observable } from 'rxjs';
import { NotificationService } from '@/app/core/services/notification-services';

export interface ConfirmActionOptions {
    confirm: ConfirmationService;
    notify: NotificationService;
    header: string;
    message: string;
    acceptLabel: string;
    acceptSeverity?: 'primary' | 'danger';
    action$: () => Observable<unknown>;
    successMessage: string;
}

/**
 * Pide confirmación al usuario y, si acepta, ejecuta una acción asíncrona
 * notificando éxito o error. Patrón usado en todos los listados con borrado
 * y acciones destructivas/irreversibles.
 *
 * El Observable se crea dentro del `accept` para que la petición no salga
 * hasta que el usuario confirme.
 */
export function confirmAndRun(opts: ConfirmActionOptions): void {
    const { confirm, notify, header, message, acceptLabel, acceptSeverity = 'primary', action$, successMessage } = opts;

    confirm.confirm({
        message,
        header,
        icon: 'pi pi-exclamation-triangle',
        acceptButtonProps: { label: acceptLabel, severity: acceptSeverity },
        rejectButtonProps: { label: 'Cancelar', severity: 'secondary', text: true },
        accept: () => {
            action$().subscribe({
                next: () => notify.show('success', successMessage),
                error: (error: unknown) => notify.handleGenericError(error)
            });
        }
    });
}
