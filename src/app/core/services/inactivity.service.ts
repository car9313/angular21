// src/app/core/services/inactivity.service.ts
import { Injectable, inject, OnDestroy } from '@angular/core';
import { Subject, debounceTime, takeUntil } from 'rxjs';

import { LogoutService } from './logout.service';
import { SessionStore } from '../store/session.store';

const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutos
const ACTIVITY_DEBOUNCE_MS = 1_000;

/**
 * Cierre de sesión automático por inactividad.
 *
 * Escucha eventos de interacción del usuario (click, teclado, scroll, etc.)
 * con un debounce de 1s para no reiniciar el timer miles de veces por segundo
 * (mousemove/scroll). Si no hay actividad durante `timeoutMs`, deriva a
 * `LogoutService.logout()` — revocación best-effort + limpieza local + login.
 *
 * Solo corre con sesión activa: `start()` no hace nada si no hay usuario.
 * El ciclo de vida lo gobierna el host (AppLayout): start() al montar,
 * stop() al desmontar (ngOnDestroy) — así nunca queda un timer colgado.
 */
@Injectable({ providedIn: 'root' })
export class InactivityService implements OnDestroy {
    private readonly session = inject(SessionStore);
    private readonly logout = inject(LogoutService);

    private readonly activity$ = new Subject<void>();
    private readonly destroy$ = new Subject<void>();
    private timer: ReturnType<typeof setTimeout> | null = null;

    private readonly activityEvents = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'] as const;

    start(timeoutMs: number = DEFAULT_TIMEOUT_MS): void {
        if (!this.session.isAuthenticated()) return;

        this.activityEvents.forEach((eventName) => {
            window.addEventListener(eventName, this.onActivity, { passive: true });
        });

        // El debounce comprime ráfagas de actividad (mousemove dispara decenas
        // de eventos por segundo) a un único reset por segundo.
        this.activity$
            .pipe(debounceTime(ACTIVITY_DEBOUNCE_MS), takeUntil(this.destroy$))
            .subscribe(() => this.resetTimer(timeoutMs));

        this.resetTimer(timeoutMs);
    }

    stop(): void {
        this.activityEvents.forEach((eventName) => {
            window.removeEventListener(eventName, this.onActivity);
        });
        this.destroy$.next();
        this.destroy$.complete();
        this.clearTimer();
    }

    ngOnDestroy(): void {
        this.stop();
    }

    private readonly onActivity = (): void => {
        // La actividad CANCELA el vencimiento pendiente de inmediato; el
        // debounce rearma después. Sin esto, actividad justo antes del timeout
        // corría una carrera con el timer original (podía vencer en el mismo
        // tick que el reset del debounce).
        this.clearTimer();
        this.activity$.next();
    };

    private resetTimer(timeoutMs: number): void {
        this.clearTimer();
        this.timer = setTimeout(() => void this.logout.logout(), timeoutMs);
    }

    private clearTimer(): void {
        if (this.timer !== null) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
}