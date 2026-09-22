import { Injectable, inject, signal, Signal } from '@angular/core';
import { NavigationEnd, Router, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class PageTitleService {
    private _title = signal<string>('');
    readonly title: Signal<string> = this._title;

    private _overrideTitle = '';

    private readonly router = inject(Router);

    constructor() {
        this._title.set(this.resolveTitle(this.router.routerState.root));
        this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
            this._overrideTitle = '';
            this._title.set(this.resolveTitle(this.router.routerState.root));
        });
    }

    setTitle(value: string): void {
        this._overrideTitle = value;
        this._title.set(value);
    }

    /**
     * Resolves the DEEPEST route title (depth-first), falling back to the
     * nearest ancestor that declares one.
     *
     * Reads routeConfig.data (own data only, never the accumulated
     * snapshot.data): otherwise the first group's inherited title would mask
     * the leaf's own title.
     *
     * Defensive navigation-chain access: this service is constructed inside
     * the topbar DURING route activation. In that window the router state
     * can expose children whose snapshot chain is not fully built — reading
     * through it must resolve to '' and NEVER throw, because a throw here
     * cancels the whole navigation (blank page, empty outlet).
     */
    private resolveTitle(route: ActivatedRoute): string {
        const child = route.children.find((c) => !c.outlet || c.outlet === 'primary');

        if (!child) {
            return (route.snapshot?.routeConfig?.data?.['title'] as string | undefined) ?? '';
        }

        const deepest = this.resolveTitle(child);
        if (deepest) {
            return deepest;
        }

        return (child.snapshot?.routeConfig?.data?.['title'] as string | undefined) ?? '';
    }
}