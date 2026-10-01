import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';

import { InactivityService } from './inactivity.service';
import { LogoutService } from './logout.service';
import { SessionStore } from '../store/session.store';

const USER = {
    id: '1',
    username: 'juan',
    fullName: 'Juan Pérez',
    roles: ['Admin']
};

function fireActivity(): void {
    window.dispatchEvent(new Event('click'));
}

describe('InactivityService', () => {
    let service: InactivityService;
    let logout: { logout: ReturnType<typeof vi.fn> };
    let session: InstanceType<typeof SessionStore>;

    beforeEach(() => {
        vi.useFakeTimers();

        logout = { logout: vi.fn(() => Promise.resolve()) };

        TestBed.configureTestingModule({
            providers: [{ provide: LogoutService, useValue: logout }]
        });

        service = TestBed.inject(InactivityService);
        session = TestBed.inject(SessionStore);
    });

    afterEach(() => {
        service.stop();
        vi.useRealTimers();
    });

    it('does nothing without an active session', () => {
        service.start(10_000);
        vi.advanceTimersByTime(20_000);
        expect(logout.logout).not.toHaveBeenCalled();
    });

    it('logs out after the timeout when the session is active', () => {
        session.setUser(USER);
        session.markConfigLoaded();

        service.start(10_000);
        vi.advanceTimersByTime(10_000);

        expect(logout.logout).toHaveBeenCalledTimes(1);
    });

    it('resets the timer on user activity before the timeout', () => {
        session.setUser(USER);
        session.markConfigLoaded();

        service.start(10_000);

        // Actividad a los 9s: el timer se reinicia (debounce 1s + reset).
        vi.advanceTimersByTime(9_000);
        fireActivity();
        vi.advanceTimersByTime(1_000); // debounce
        vi.advanceTimersByTime(9_000); // todavía dentro del nuevo timeout

        expect(logout.logout).not.toHaveBeenCalled();

        // Sin actividad adicional, ahora sí vence.
        vi.advanceTimersByTime(1_000);
        expect(logout.logout).toHaveBeenCalledTimes(1);
    });

    it('stops listening and clears the timer on stop()', () => {
        session.setUser(USER);
        session.markConfigLoaded();

        service.start(10_000);
        service.stop();

        fireActivity();
        vi.advanceTimersByTime(30_000);

        expect(logout.logout).not.toHaveBeenCalled();
    });
});