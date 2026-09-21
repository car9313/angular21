import { Injectable, signal, Signal, inject, effect } from '@angular/core';
import { Router, NavigationEnd, ActivatedRouteSnapshot } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../modules/auth/services/auth.service';

export interface QuickAccess {
    label: string;
    url: string;
    routerLink: string | any[];
}

@Injectable({ providedIn: 'root' })
export class QuickAccessService {
    private readonly _history = signal<QuickAccess[]>(this.loadHistory());
    /** Exponemos la señal como solo lectura */
    readonly history = this._history.asReadonly();

    readonly chipNavigations: Signal<QuickAccess[]> = this._history;
    private readonly _currentUrl = signal<string>('');
    /** URL actual normalizada (sin query, decodificada, sin slash final) para marcar el chip activo */
    readonly currentUrl = this._currentUrl.asReadonly();
    private authService = inject(AuthService);
    private readonly STORAGE_KEY = 'quick_access_history';

    constructor(private router: Router) {
        this._currentUrl.set(this.normalizeUrl(this.router.url));

        // 🔹 Inicializar con snapshot actual si está vacío
        if (this._history().length === 0) {
            this.initializeFromSnapshot();
        }

        // 🔹 Sincronizar con sessionStorage cada vez que cambie la señal
        // Cada vez que cambia la señal, se guarda en sessionStorage
        effect(() => {
            const value = this._history();
            sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(value));
        });

        // 🔹 Limpiar en logout
        effect(() => {
            this.authService.ensureLoggedIn().subscribe({
                next: (state) => {
                    if (!state) this.clear();
                }
            });
        });

        // 🔹 Escuchar navegación y actualizar historial
        this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
            this._currentUrl.set(this.normalizeUrl(this.router.url));
            this.addCurrentRouteToHistory();
        });
    }
    /**
     * Normaliza una URL para poder compararla: quita los query params, decodifica
     * los caracteres codificados (router.url viene con %C3%B3, los crumbs nacen con 'ó'),
     * colapsa dobles slashes (raíz '' + segmento → '//x') y quita el slash final
     * (rutas con hijo path: '' generan '/solicitudes/').
     */
    private normalizeUrl(url: string): string {
        let clean = url.split('?')[0];
        try {
            clean = decodeURIComponent(clean);
        } catch {
            // ya está decodificada o contiene % inválido
        }
        clean = clean.replace(/\/{2,}/g, '/').replace(/\/+$/, '');
        return clean || '/';
    }
    /** Carga el historial desde sessionStorage (normalizando URLs de sesiones previas) */
    private loadHistory(): QuickAccess[] {
        try {
            const data = sessionStorage.getItem(this.STORAGE_KEY);
            if (!data) return [];
            const parsed = JSON.parse(data) as QuickAccess[];
            return parsed.map((c) => ({ ...c, url: this.normalizeUrl(c.url) }));
        } catch {
            return [];
        }
    }
    /** Agrega un nuevo acceso (si no existe ya) */
    add(access: QuickAccess): void {
        this._history.update((h: QuickAccess[]) => {
            // Evita duplicados por URL
            const exists = h.some((item) => item.url === access.url);
            if (exists) return h;

            // Agrega al final del historial
            return [...h, access];
        });
    }

    private initializeFromSnapshot() {
        const crumbs = this.buildRouteCrumbs(this.router.routerState.snapshot.root);
        if (crumbs.length) {
            const last = crumbs[crumbs.length - 1];
            const quick: QuickAccess = {
                label: last.label ?? last.url.split('/').pop() ?? last.url,
                url: last.url,
                routerLink: last.url
            };
            this._history.set([quick]);
        }
    }

    private addCurrentRouteToHistory() {
        const crumbs = this.buildRouteCrumbs(this.router.routerState.snapshot.root);
        if (!crumbs.length) return;

        const last = crumbs[crumbs.length - 1];
        if (['/iniciar-sesión', '/no-encontrado', '/acceso'].includes(last.url) || last.url.includes('/cambiar-contraseña')) {
            return;
        }

        const quick: QuickAccess = {
            label: last.label ?? last.url.split('/').pop() ?? last.url,
            url: last.url,
            routerLink: last.url
        };

        this._history.update((current) => {
            if (current.some((c) => c.url === quick.url)) return current;
            const updated = [...current, quick];
            return updated.length > 5 ? updated.slice(-5) : updated;
        });
    }

    private buildRouteCrumbs(route: ActivatedRouteSnapshot, parentUrl: string = ''): QuickAccess[] {
        const crumbs: QuickAccess[] = [];
        const cfg = route.routeConfig;

        if (cfg) {
            const segment = (cfg.path ?? '')
                .split('/')
                .map((seg) => (seg.startsWith(':') ? (route.params[seg.slice(1)] ?? seg) : seg))
                .join('/');

            const url = this.normalizeUrl(`${parentUrl}/${segment}`);
            const label = this.interpolate(cfg.data?.['breadcrumb'] ?? cfg.data?.['ChipNavigation'] ?? segment, route);

            // Saltea nodos estructurales (path '' sin breadcrumb): su label es '' y
            // arruinaría el chip si quedan como último nodo (ver wrapper 'devoluciones').
            if (label) {
                crumbs.push({ label, url, routerLink: url });
            }
            parentUrl = url;
        }

        return route.firstChild ? crumbs.concat(this.buildRouteCrumbs(route.firstChild, parentUrl)) : crumbs;
    }

    removeAt(index: number) {
        this._history.update((h) => h.filter((_, i) => i !== index));
    }

    /**
     * Interpola tokens {{param}} con los params de la ruta y sus ancestros,
     * igual que lo hace BreadcrumbService (los chips no interpolaban antes;
     * con esto breadcrumbs y chips comparten el mismo label parametrizado).
     */
    private interpolate(value: string, snapshot: ActivatedRouteSnapshot): string {
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

    clear() {
        sessionStorage.removeItem(this.STORAGE_KEY);
        this._history.set([]);
    }
}
