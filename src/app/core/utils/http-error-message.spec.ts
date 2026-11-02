import { describe, it, expect } from 'vitest';
import { HttpErrorResponse } from '@angular/common/http';

import { getHttpErrorMessage } from './http-error-message';

const FALLBACK = 'No se pudieron cargar los datos.';

describe('getHttpErrorMessage', () => {
    it('returns the backend detail when present', () => {
        const error = new HttpErrorResponse({ status: 400, error: { detail: 'El código ya existe' } });

        expect(getHttpErrorMessage(error, FALLBACK)).toBe('El código ya existe');
    });

    it('falls back to the backend message when there is no detail', () => {
        const error = new HttpErrorResponse({ status: 500, error: { message: 'Internal failure' } });

        expect(getHttpErrorMessage(error, FALLBACK)).toBe('Internal failure');
    });

    it('uses the fallback for network errors without a body', () => {
        expect(getHttpErrorMessage(new HttpErrorResponse({ status: 0 }), FALLBACK)).toBe(FALLBACK);
    });

    it('uses the fallback for blank details or non-http values', () => {
        expect(getHttpErrorMessage(new HttpErrorResponse({ status: 404, error: { detail: '   ' } }), FALLBACK)).toBe(FALLBACK);
        expect(getHttpErrorMessage(new Error('boom'), FALLBACK)).toBe(FALLBACK);
        expect(getHttpErrorMessage(undefined, FALLBACK)).toBe(FALLBACK);
    });
});
