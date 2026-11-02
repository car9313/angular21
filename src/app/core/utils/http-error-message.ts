import { HttpErrorResponse } from '@angular/common/http';

/**
 * Extrae un mensaje amigable para el usuario a partir de un error HTTP.
 * Si el backend envió un body con `detail` legible (4xx/5xx), lo devuelve;
 * en caso contrario devuelve el mensaje de respaldo indicado.
 * El detalle técnico (status, URL, stack) debe quedar solo en consola.
 */
export function getHttpErrorMessage(err: unknown, fallback: string): string {
    const httpErr = err as HttpErrorResponse | undefined;
    const detail = httpErr?.error?.detail ?? httpErr?.error?.message;
    return typeof detail === 'string' && detail.trim() ? detail : fallback;
}
