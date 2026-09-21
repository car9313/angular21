// breadcrumb.service.ts
import { Injectable, inject, signal, Signal } from '@angular/core';
import { NavigationEnd, Router, ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
import { filter } from 'rxjs/operators';

export interface BreadCrumb {
    label: string;
    url?: string;
}

@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
    private _breadcrumbs = signal<BreadCrumb[]>([]);
    readonly breadcrumbs: Signal<BreadCrumb[]> = this._breadcrumbs;

    private readonly router = inject(Router);

    constructor() {
        // 1) Inicializa inmediatamente desde el snapshot actual (cubrir F5)
        this._breadcrumbs.set(this.buildBreadCrumb(this.router.routerState.root));

        // 2) Actualiza en cada NavigationEnd
        this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
            this._breadcrumbs.set(this.buildBreadCrumb(this.router.routerState.root));
        });
    }

    private buildBreadCrumb(route: ActivatedRoute, url = '', crumbs: BreadCrumb[] = []): BreadCrumb[] {
        const children = route.children;

        if (!children || children.length === 0) {
            return crumbs;
        }

        for (const child of children) {
            // Ignora outlets que no son primary (ej: aux outlets)
            if (child.outlet && child.outlet !== 'primary') continue;

            const routeURL = child.snapshot.url.map((segment) => segment.path).join('/');
            // concatena al url (si hay segment)
            const nextUrl = routeURL ? `${url}/${routeURL}` : url;

            // Usamos la data PROPIA de la ruta (routeConfig.data), no snapshot.data:
            // esta última ACUMULA la data de ancestros component-less (vía loadChildren),
            // lo que contaminaba breadcrumbUrl de rutas hijo sin configuración propia.
            const routeData = child.snapshot.routeConfig?.data ?? {};
            // Si existe data.breadcrumb lo añadimos aunque routeURL sea ''
            const hasBreadcrumb = routeData['breadcrumb'];
            if (hasBreadcrumb) {
                const raw = routeData['breadcrumb'] as string;
                const label = this.interpolate(raw, child.snapshot);
                // breadcrumbUrl: false → crumb como texto plano (no navegable)
                // breadcrumbUrl: '<url>' → URL personalizada (con tokens {{param}} interpolados)
                const crumbUrlCfg = routeData['breadcrumbUrl'];
                // Sin breadcrumbUrl explícito solo es navegable si la ruta es una página real
                // (component/loadComponent); los grupos (solo loadChildren, sin componente)
                // quedan como texto porque su URL acumulada no lleva a ninguna página.
                const routeConfig = child.snapshot.routeConfig;
                const isRealPage = !!(routeConfig?.component || routeConfig?.loadComponent);
                const crumbUrl = crumbUrlCfg === false ? null : typeof crumbUrlCfg === 'string' ? this.interpolate(crumbUrlCfg, child.snapshot) : isRealPage ? nextUrl || '/' : null;
                crumbs.push(crumbUrl ? { label, url: crumbUrl } : { label });
            }

            // Recurse down the tree (seguimos por la primera rama primaria)
            return this.buildBreadCrumb(child, nextUrl, crumbs);
        }

        return crumbs;
    }

    private interpolate(value: string, snapshot: ActivatedRouteSnapshot): string {
        // Interpola tokens {{param}} con los params de la ruta actual y sus ancestros
        return value.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
            const params: Record<string, string> = {};
            let snap: ActivatedRouteSnapshot | null = snapshot;
            while (snap) {
                Object.assign(params, snap.params);
                snap = snap.parent;
            }
            return params[key] ?? '';
        });
    }
}
