import { describe, it, expect } from 'vitest';
import { PRIMENG_ES_TRANSLATION } from './primeng-es-translation';

/**
 * Contract spec: PrimeNG widgets render these strings directly to users
 * (dialogs, calendars, paginators). If a key goes missing after a PrimeNG
 * upgrade, the UI silently falls back to English — these guards keep the
 * contract explicit.
 */
describe('PRIMENG_ES_TRANSLATION', () => {
    it('covers the user-facing action labels', () => {
        expect(PRIMENG_ES_TRANSLATION.accept).toBe('Aceptar');
        expect(PRIMENG_ES_TRANSLATION.reject).toBe('Rechazar');
        expect(PRIMENG_ES_TRANSLATION.cancel).toBe('Cancelar');
        expect(PRIMENG_ES_TRANSLATION.clear).toBe('Limpiar');
        expect(PRIMENG_ES_TRANSLATION.apply).toBe('Aplicar');
        expect(PRIMENG_ES_TRANSLATION.upload).toBe('Subir');
    });

    it('configures the Spanish calendar convention', () => {
        expect(PRIMENG_ES_TRANSLATION.firstDayOfWeek).toBe(1);
        expect(PRIMENG_ES_TRANSLATION.dateFormat).toBe('dd/mm/yy');
        expect(PRIMENG_ES_TRANSLATION.dayNamesMin).toEqual(['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá']);
        expect(PRIMENG_ES_TRANSLATION.monthNames?.[8]).toBe('Septiembre');
    });

    it('covers empty states for tables and filters', () => {
        expect(PRIMENG_ES_TRANSLATION.emptyMessage).toBe('No hay resultados');
        expect(PRIMENG_ES_TRANSLATION.emptyFilterMessage).toBe('No se encontraron resultados');
    });
});
