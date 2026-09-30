// notification.service.ts
import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';

type ToastSeverity = 'success' | 'info' | 'warn' | 'error';

interface ProblemDetailsLike {
    message?: string;
    detail?: string;
    errors?: Record<string, string[] | string>;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
    private readonly messageService = inject(MessageService);

    show(severity: ToastSeverity, message: string, life = 3000): void {
        this.messageService.add({
            severity,
            summary: this.getSummary(severity),
            detail: message,
            life
        });
    }

    verification(res: HttpErrorResponse | { status: number; error?: unknown }): void {
        const status = res?.status ?? 0;
        if (status >= 200 && status < 300) {
            this.show('success', this.getSuccessMessage(status));
            return;
        }

        /* if (status === 400 || status === 401 || status === 409) {
            const msg = this.getErrorMessage(res.error);
            this.show('error', msg);
            return;
        }*/
        if (status >= 400 && status < 500) {
            const msg = this.getErrorMessage(res.error);
            this.show('error', msg);
            return;
        }

        if (status === 0 || status >= 500) {
            this.show('error', 'Error en el servidor.');
            return;
        }

        this.show('error', 'Error desconocido.');
    }

    handleGenericError(error: unknown): void {
        if (error instanceof HttpErrorResponse) {
            this.verification(error);
        } else if (error instanceof Error) {
            this.show('error', error.message);
        } else {
            this.show('error', 'Error inesperado en la aplicación');
        }
    }

    private isProblemDetails(value: unknown): value is ProblemDetailsLike {
        return typeof value === 'object' && value !== null;
    }

    private getErrorMessage(error: unknown): string {
        if (!error) return 'Error en el envío de datos.';
        if (typeof error === 'string') return error;

        if (this.isProblemDetails(error)) {
            if (typeof error.message === 'string' && error.message.trim()) {
                return error.message;
            }
            if (error.errors) {
                const values = Object.values(error.errors)
                    .flat()
                    .filter((v): v is string => typeof v === 'string');
                if (values.length) return values.join(', ');
            }
            if (typeof error.detail === 'string' && error.detail.trim()) {
                return error.detail;
            }
        }

        return 'Error en el envío de datos.';
    }

    private getSummary(severity: ToastSeverity): string {
        const map = { success: 'Éxito', info: 'Información', warn: 'Advertencia', error: 'Error' } as const;
        return map[severity] ?? 'Mensaje';
    }

    private getSuccessMessage(status: number): string {
        switch (status) {
            case 200:
                return 'Operación exitosa.';
            case 201:
                return 'Creado correctamente.';
            case 204:
                return 'Eliminado correctamente.';
            default:
                return 'Operación completada.';
        }
    }
}
