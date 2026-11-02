import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
    formatDateCell,
    formatDateForDisplay,
    formatDateTimeForDisplay,
    formatDateToISO,
    formatTime,
    formatTimeForDisplay,
    parseISOToDate,
    parseTimeToDate
} from './date-mapper.helper';

describe('date-mapper.helper', () => {
    let warn: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    });

    afterEach(() => {
        warn.mockRestore();
    });

    it('formats a Date as YYYY-MM-DD using local components', () => {
        expect(formatDateToISO(new Date(2026, 0, 5))).toBe('2026-01-05');
        expect(formatDateToISO(null)).toBe('');
    });

    it('formats a Date as HH:mm:ss.SSS', () => {
        expect(formatTime(new Date(2026, 0, 5, 7, 8, 9, 10))).toBe('07:08:09.010');
        expect(formatTime(null)).toBe('');
    });

    it('parses YYYY-MM-DD to a local midnight Date', () => {
        const date = parseISOToDate('2026-02-01');

        expect(date?.getFullYear()).toBe(2026);
        expect(date?.getMonth()).toBe(1);
        expect(date?.getDate()).toBe(1);
        expect(parseISOToDate('')).toBeNull();
        expect(parseISOToDate('2026-13')).toBeNull();
    });

    it('parses HH:mm:ss with optional milliseconds and zone suffix', () => {
        const withMillis = parseTimeToDate('13:45:30.250');
        const withZone = parseTimeToDate('13:45:30Z');

        expect(withMillis?.getHours()).toBe(13);
        expect(withMillis?.getMinutes()).toBe(45);
        expect(withMillis?.getMilliseconds()).toBe(250);
        expect(withZone?.getHours()).toBe(13);
        expect(parseTimeToDate('not-a-time')).toBeNull();
        expect(parseTimeToDate(undefined)).toBeNull();
    });

    it('formats datetimes for detail views', () => {
        expect(formatDateTimeForDisplay('2026-02-01T13:45:30.123')).toBe('01/02/2026 13:45');
        expect(formatDateTimeForDisplay('2026-02-01')).toBe('01/02/2026');
        expect(formatDateTimeForDisplay(null)).toBe('');
        expect(formatDateTimeForDisplay('bad')).toBe('');
    });

    it('formats date cells without shifting the timezone', () => {
        expect(formatDateCell('2026-02-01T00:00:00')).toBe('01/02/2026');
        expect(formatDateCell(new Date(2026, 1, 1))).toBe('01/02/2026');
        expect(formatDateCell(null)).toBe('');
        expect(formatDateCell('not-a-date')).toBe('');
    });

    it('formats display dates and times', () => {
        expect(formatDateForDisplay('2026-02-01')).toBe('01/02/2026');
        expect(formatDateForDisplay('')).toBe('');
        expect(formatTimeForDisplay('13:45:30.1234567')).toBe('13:45:30');
        expect(formatTimeForDisplay('13:45')).toBe('');
    });
});
