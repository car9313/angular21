import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';

import { LayoutService } from './layout.service';

const STORAGE_KEY = 'sakai.layout.config';

/** Crea una instancia "de boot" como si Angular arrancara el servicio. */
function boot(): LayoutService {
    return TestBed.runInInjectionContext(() => new LayoutService());
}

/**
 * En zoneless, los effects corren en el flush del framework; en tests se
 * disparan explícitamente con TestBed.flushEffects() (API oficial), no por
 * timers adivinados.
 */
function flushEffects(): void {
    TestBed.flushEffects();
}

describe('LayoutService', () => {
    let service: LayoutService;

    beforeEach(() => {
        localStorage.clear();
        document.documentElement.classList.remove('app-dark');
        TestBed.configureTestingModule({});
        service = TestBed.inject(LayoutService);
        flushEffects();
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('starts with defaults when nothing is persisted', () => {
        expect(service.layoutConfig()).toEqual({
            preset: 'Aura',
            primary: 'emerald',
            surface: null,
            darkTheme: false,
            menuMode: 'static'
        });
        expect(service.layoutState().staticMenuDesktopInactive).toBe(false);
    });

    it('persists layout changes to localStorage', () => {
        service.layoutConfig.update((state) => ({ ...state, darkTheme: true, primary: 'blue' }));
        service.layoutState.update((state) => ({ ...state, staticMenuDesktopInactive: true }));
        flushEffects();

        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
        expect(saved.config.darkTheme).toBe(true);
        expect(saved.config.primary).toBe('blue');
        expect(saved.staticMenuDesktopInactive).toBe(true);
    });

    it('does not write storage when nothing changed (idempotent)', () => {
        flushEffects();
        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('restores persisted config on a new instance (simulates reload)', () => {
        service.layoutConfig.update((state) => ({ ...state, preset: 'Lara', menuMode: 'overlay', darkTheme: true }));
        flushEffects();
        expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();

        const second = boot();
        expect(second.layoutConfig().preset).toBe('Lara');
        expect(second.layoutConfig().menuMode).toBe('overlay');
        expect(second.layoutConfig().darkTheme).toBe(true);
    });

    it('survives corrupt JSON and falls back to defaults', () => {
        localStorage.setItem(STORAGE_KEY, '{broken json');
        const booted = boot();
        expect(booted.layoutConfig().preset).toBe('Aura');
        expect(booted.layoutConfig().darkTheme).toBe(false);
    });

    it('applies dark mode class to documentElement when restoring darkTheme', () => {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ config: { preset: 'Aura', primary: 'emerald', surface: null, darkTheme: true, menuMode: 'static' }, staticMenuDesktopInactive: false })
        );
        boot();

        expect(document.documentElement.classList.contains('app-dark')).toBe(true);
    });

    it('toggles the dark class on darkTheme change', () => {
        service.layoutConfig.update((state) => ({ ...state, darkTheme: true }));
        flushEffects();
        expect(document.documentElement.classList.contains('app-dark')).toBe(true);

        service.layoutConfig.update((state) => ({ ...state, darkTheme: false }));
        flushEffects();
        expect(document.documentElement.classList.contains('app-dark')).toBe(false);
    });

    it('restores collapsed sidebar from storage', () => {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ config: { preset: 'Aura', primary: 'emerald', surface: null, darkTheme: false, menuMode: 'static' }, staticMenuDesktopInactive: true })
        );
        const booted = boot();
        expect(booted.layoutState().staticMenuDesktopInactive).toBe(true);
    });
});