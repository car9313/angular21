import { Injectable, inject, signal } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

/** Minimum navigation duration before the spinner shows, avoiding flicker on instant transitions. */
const MIN_VISIBLE_MS = 200;

/**
 * Global loading state driven by router navigation.
 *
 * Designed for the app-level spinner (rendered once in AppComponent) and for
 * any consumer that wants to react to "a route transition or a page-bound
 * refresh is in flight".
 *
 * State is a signal so zoneless change detection picks it up without extra
 * plumbing. The router emitter is the single writer: NavigationStart turns the
 * flag on, and any terminal event (End/Cancel/Error) turns it off — including
 * cancelled or failed navigations, so the spinner can never stay stuck.
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
    private readonly _loading = signal(false);
    private readonly router = inject(Router);

    /** True while a route transition is in flight. */
    readonly loading = this._loading.asReadonly();

    constructor() {
        // A route transition that resolves fast (session already hydrated,
        // lazy chunk already loaded) would make the spinner blink. Delay the
        // ON signal; the OFF signal is immediate so a slow transition is shown
        // for its whole remaining duration.
        let timer: ReturnType<typeof setTimeout> | undefined;

        this.router.events
            .pipe(filter((event) => event instanceof NavigationStart || event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError))
            .subscribe((event) => {
                if (event instanceof NavigationStart) {
                    if (timer) clearTimeout(timer);
                    timer = setTimeout(() => this._loading.set(true), MIN_VISIBLE_MS);
                } else {
                    if (timer) clearTimeout(timer);
                    this._loading.set(false);
                }
            });
    }
}
