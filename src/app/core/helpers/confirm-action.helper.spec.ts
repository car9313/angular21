import { describe, it, expect, vi } from 'vitest';
import { ConfirmationService } from 'primeng/api';
import { of, throwError } from 'rxjs';

import { confirmAndRun, ConfirmActionOptions } from './confirm-action.helper';
import { NotificationService } from '../services/notification-services';

interface ConfirmationConfig {
    message: string;
    header: string;
    icon: string;
    acceptButtonProps: { label: string; severity: string };
    rejectButtonProps: { label: string; severity: string; text: boolean };
    accept: () => void;
}

function setup(action$: ConfirmActionOptions['action$']) {
    const confirm = { confirm: vi.fn() };
    const notify = { show: vi.fn(), handleGenericError: vi.fn() };
    const options: ConfirmActionOptions = {
        confirm: confirm as unknown as ConfirmationService,
        notify: notify as unknown as NotificationService,
        header: 'Eliminar',
        message: '¿Seguro?',
        acceptLabel: 'Eliminar',
        acceptSeverity: 'danger',
        action$,
        successMessage: 'Eliminado'
    };

    return { confirm, notify, options };
}

function configOf(confirm: { confirm: ReturnType<typeof vi.fn> }): ConfirmationConfig {
    return confirm.confirm.mock.calls[0][0] as ConfirmationConfig;
}

describe('confirmAndRun', () => {
    it('builds the confirmation dialog with the requested labels and severity', () => {
        const { confirm, options } = setup(() => of(undefined));

        confirmAndRun(options);

        const config = configOf(confirm);
        expect(config.header).toBe('Eliminar');
        expect(config.message).toBe('¿Seguro?');
        expect(config.icon).toBe('pi pi-exclamation-triangle');
        expect(config.acceptButtonProps).toEqual({ label: 'Eliminar', severity: 'danger' });
        expect(config.rejectButtonProps).toEqual({ label: 'Cancelar', severity: 'secondary', text: true });
    });

    it('does not run the action until the user accepts', () => {
        const action$ = vi.fn(() => of(undefined));
        const { confirm, notify, options } = setup(action$);

        confirmAndRun(options);

        expect(action$).not.toHaveBeenCalled();
        expect(notify.show).not.toHaveBeenCalled();
        expect(confirm.confirm).toHaveBeenCalledTimes(1);
    });

    it('runs the action on accept and notifies success', () => {
        const action$ = vi.fn(() => of(undefined));
        const { confirm, notify, options } = setup(action$);

        confirmAndRun(options);
        configOf(confirm).accept();

        expect(action$).toHaveBeenCalledTimes(1);
        expect(notify.show).toHaveBeenCalledWith('success', 'Eliminado');
        expect(notify.handleGenericError).not.toHaveBeenCalled();
    });

    it('delegates to the generic error handler when the action fails', () => {
        const error = new Error('network down');
        const { confirm, notify, options } = setup(() => throwError(() => error));

        confirmAndRun(options);
        configOf(confirm).accept();

        expect(notify.handleGenericError).toHaveBeenCalledWith(error);
        expect(notify.show).not.toHaveBeenCalled();
    });

    it('defaults the accept severity to primary', () => {
        const confirm = { confirm: vi.fn() };
        const notify = { show: vi.fn(), handleGenericError: vi.fn() };

        confirmAndRun({
            confirm: confirm as unknown as ConfirmationService,
            notify: notify as unknown as NotificationService,
            header: 'Aplicar',
            message: '¿Aplicar?',
            acceptLabel: 'Aplicar',
            action$: () => of(undefined),
            successMessage: 'Aplicado'
        });

        expect(configOf(confirm).acceptButtonProps.severity).toBe('primary');
    });
});
