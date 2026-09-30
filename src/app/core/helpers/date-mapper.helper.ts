// core/helpers/date-mapper.helper.ts

/**
 * Convierte un objeto Date a string en formato 'YYYY-MM-DD' (sin zona horaria).
 * Útil para enviar fechas al backend.
 */
export function formatDateToISO(date: Date | null): string {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Convierte un objeto Date a string en formato 'HH:mm:ss.SSS' (hora local).
 * Útil para enviar horas al backend.
 */
export function formatTime(date: Date | null): string {
    if (!date) return '';
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
}

/**
 * Parsea un string 'YYYY-MM-DD' a un objeto Date (a las 00:00:00 en hora local).
 * Retorna null si el string es inválido o vacío.
 */
export function parseISOToDate(dateStr: string | null | undefined): Date | null {
    if (!dateStr) return null;
    const parts = dateStr.split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) {
        console.warn('Formato de fecha inválido:', dateStr);
        return null;
    }
    // Año, mes (0-indexado), día
    return new Date(parts[0], parts[1] - 1, parts[2]);
}

/**
 * Parsea un string 'HH:mm:ss.SSS' a un objeto Date (usando fecha actual como base,
 * pero solo importa la hora). Retorna null si el string es inválido o vacío.
 * Acepta posibles sufijos de zona horaria (por ejemplo 'Z').
 * Nota: La fecha base es el día de hoy, pero solo se usan horas/minutos/segundos/milisegundos.
 * Para el formulario de edición, esto basta porque el picker de hora solo necesita la hora.
 */
export function parseTimeToDate(timeStr: string | null | undefined): Date | null {
    if (!timeStr) return null;
    // Acepta formatos: "HH:mm:ss", "HH:mm:ss.SSS", con sufijo opcional de zona ('Z', '+HH:00', etc.)
    const regex = /^(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?(?:[Zz]|[+-]\d{2}:\d{2})?$/;
    const match = timeStr.match(regex);
    if (!match) {
        console.warn('Formato de hora inválido:', timeStr);
        return null;
    }
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const seconds = parseInt(match[3], 10);
    const milliseconds = match[4] ? parseInt(match[4].padEnd(3, '0'), 10) : 0;

    // Creamos un Date con fecha actual y la hora extraída
    const now = new Date();
    now.setHours(hours, minutes, seconds, milliseconds);
    return now;
}

/**
 * Formatea un datetime 'YYYY-MM-DDTHH:mm:ss.SSS' a 'DD/MM/YYYY HH:mm' para mostrar en vistas de detalle.
 * Retorna '' si el string es inválido o vacío.
 */
export function formatDateTimeForDisplay(dateTimeStr: string | null | undefined): string {
    if (!dateTimeStr) return '';
    const [datePart, timePart] = dateTimeStr.split('T');
    const date = formatDateForDisplay(datePart);
    if (!date) return '';
    const hours = timePart?.slice(0, 5) ?? '';
    return hours ? `${date} ${hours}` : date;
}

/**
 * Formatea una fecha para celdas de tablas/listas a 'DD/MM/YYYY'.
 * Acepta Date | string porque algunos modelos tipan Date pero traen strings desde el API (JSON).
 * Para strings usa slicing del 'YYYY-MM-DD...' SIN pasar por new Date(): evita el off-by-one
 * de zona horaria (new Date('2026-02-01') es medianoche UTC; en UTC-5 mostraría 31/01).
 */
export function formatDateCell(value: Date | string | null | undefined): string {
    if (!value) return '';
    if (typeof value === 'string') {
        const parts = value.slice(0, 10).split('-').map(Number);
        const [year, month, day] = parts;
        if (parts.length !== 3 || parts.some((p) => isNaN(p))) {
            console.warn('Formato de fecha inválido:', value);
            return '';
        }
        return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
    }
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${day}/${month}/${year}`;
}

/**
 * Formatea una fecha 'YYYY-MM-DD' a 'DD/MM/YYYY' para mostrar en vistas de detalle.
 * Retorna '' si el string es inválido o vacío.
 */
export function formatDateForDisplay(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    const parts = dateStr.split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) {
        console.warn('Formato de fecha inválido:', dateStr);
        return '';
    }
    const [year, month, day] = parts;
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
}

/**
 * Formatea una hora 'HH:mm:ss.SSSSSSS' a 'HH:mm:ss' para mostrar en vistas de detalle.
 * Retorna '' si el string es inválido o vacío.
 */
export function formatTimeForDisplay(timeStr: string | null | undefined): string {
    if (!timeStr) return '';
    const match = timeStr.match(/^(\d{2}):(\d{2}):(\d{2})/);
    if (!match) {
        console.warn('Formato de hora inválido:', timeStr);
        return '';
    }
    const [, hours, minutes, seconds] = match;
    return `${hours}:${minutes}:${seconds}`;
}
