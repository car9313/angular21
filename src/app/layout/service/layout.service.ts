import { Injectable, effect, signal, computed } from '@angular/core';

export interface LayoutConfig {
    preset: string;
    primary: string;
    surface: string | undefined | null;
    darkTheme: boolean;
    menuMode: string;
}

interface LayoutState {
    staticMenuDesktopInactive: boolean;
    overlayMenuActive: boolean;
    configSidebarVisible: boolean;
    mobileMenuActive: boolean;
    menuHoverActive: boolean;
    activePath: string | null;
    expandedGroups: string[];
}

interface PersistedLayout {
    config: LayoutConfig;
    staticMenuDesktopInactive: boolean;
}

const STORAGE_KEY = 'sakai.layout.config';

/** Estado por defecto: tema claro Aura + menú estático visible. */
const DEFAULT_CONFIG: LayoutConfig = {
    preset: 'Aura',
    primary: 'emerald',
    surface: null,
    darkTheme: false,
    menuMode: 'static'
};

const DEFAULT_STATE: LayoutState = {
    staticMenuDesktopInactive: false,
    overlayMenuActive: false,
    configSidebarVisible: false,
    mobileMenuActive: false,
    menuHoverActive: false,
    activePath: null,
    expandedGroups: []
};

/**
 * Estado del layout con persistencia en localStorage.
 *
 * Se restauran solo dos piezas con sentido entre sesiones:
 * - `layoutConfig` (preset/primary/surface/darkTheme/menuMode)
 * - sidebar colapsada (`staticMenuDesktopInactive`)
 *
 * Los flags transitorios (overlay/mobile/configSidebar/menuHover/activePath)
 * NO se persisten: son por interacción, no preferencias.
 *
 * El dark mode inicial se aplica síncrono en el constructor (sin transición);
 * los cambios posteriores pasan por `effect` que compara contra el DOM para
 * decidir si hay transición. Sin flags de "primera vez": el DOM es la verdad.
 */
@Injectable({
    providedIn: 'root'
})
export class LayoutService {
    /** Se inicializa desde localStorage: usuario no pierde su layout al recargar. */
    layoutConfig = signal<LayoutConfig>(LayoutService.restoreConfig());

    layoutState = signal<LayoutState>(LayoutService.restoreState());

    theme = computed(() => (this.layoutConfig().darkTheme ? 'light' : 'dark'));

    isSidebarActive = computed(() => this.layoutState().overlayMenuActive || this.layoutState().mobileMenuActive);

    isDarkTheme = computed(() => this.layoutConfig().darkTheme);

    getPrimary = computed(() => this.layoutConfig().primary);

    getSurface = computed(() => this.layoutConfig().surface);

    isOverlay = computed(() => this.layoutConfig().menuMode === 'overlay');

    transitionComplete = signal<boolean>(false);

    /** Último payload persistido, para no escribir localStorage si nada cambió. */
    private lastPersisted = LayoutService.readRaw() || LayoutService.serializeDefault();

    constructor() {
        // Aplica el tema persistido de inmediato: el boot no debe esperar al
        // primer flush de effects ni animar una transición.
        this.toggleDarkMode(this.layoutConfig());

        effect(() => {
            const config = this.layoutConfig();
            // DOM ya refleja lo pedido (boot, o darkTheme igual): nada que hacer.
            if (document.documentElement.classList.contains('app-dark') === config.darkTheme) {
                return;
            }
            this.handleDarkModeTransition(config);
        });

        effect(() => {
            const payload: PersistedLayout = {
                config: this.layoutConfig(),
                staticMenuDesktopInactive: this.layoutState().staticMenuDesktopInactive
            };
            const serialized = JSON.stringify(payload);
            if (serialized === this.lastPersisted) return;
            this.lastPersisted = serialized;
            localStorage.setItem(STORAGE_KEY, serialized);
        });
    }

    private static restoreConfig(): LayoutConfig {
        const saved = LayoutService.readPersisted();
        return saved ? { ...DEFAULT_CONFIG, ...saved.config } : DEFAULT_CONFIG;
    }

    private static restoreState(): LayoutState {
        const saved = LayoutService.readPersisted();
        return saved
            ? { ...DEFAULT_STATE, staticMenuDesktopInactive: saved.staticMenuDesktopInactive }
            : DEFAULT_STATE;
    }

    private static readPersisted(): PersistedLayout | null {
        try {
            const raw = LayoutService.readRaw();
            if (!raw) return null;
            const parsed = JSON.parse(raw) as PersistedLayout;
            if (!parsed?.config) return null;
            return parsed;
        } catch {
            // JSON corrupto o storage no disponible: arranca con defaults.
            return null;
        }
    }

    private static readRaw(): string {
        try {
            return localStorage.getItem(STORAGE_KEY) ?? '';
        } catch {
            return '';
        }
    }

    /**
     * El payload que los defaults producirían. Sirve para que el primer flush
     * no escriba nada si el usuario jamás cambió el layout (cero I/O innecesario).
     */
    private static serializeDefault(): string {
        const payload: PersistedLayout = { config: DEFAULT_CONFIG, staticMenuDesktopInactive: DEFAULT_STATE.staticMenuDesktopInactive };
        return JSON.stringify(payload);
    }

    private handleDarkModeTransition(config: LayoutConfig): void {
        if ('startViewTransition' in document) {
            document.startViewTransition(() => {
                this.toggleDarkMode(config);
            });
        } else {
            this.toggleDarkMode(config);
        }
    }

    toggleDarkMode(config?: LayoutConfig): void {
        const _config = config || this.layoutConfig();
        if (_config.darkTheme) {
            document.documentElement.classList.add('app-dark');
        } else {
            document.documentElement.classList.remove('app-dark');
        }
    }

    onMenuToggle() {
        if (this.isOverlay()) {
            this.layoutState.update((prev) => ({ ...prev, overlayMenuActive: !this.layoutState().overlayMenuActive }));
        }

        if (this.isDesktop()) {
            this.layoutState.update((prev) => ({ ...prev, staticMenuDesktopInactive: !this.layoutState().staticMenuDesktopInactive }));
        } else {
            this.layoutState.update((prev) => ({ ...prev, mobileMenuActive: !this.layoutState().mobileMenuActive }));
        }
    }

    showConfigSidebar() {
        this.layoutState.update((prev) => ({ ...prev, configSidebarVisible: true }));
    }

    hideConfigSidebar() {
        this.layoutState.update((prev) => ({ ...prev, configSidebarVisible: false }));
    }

    isDesktop() {
        return window.innerWidth > 991;
    }

    isMobile() {
        return !this.isDesktop();
    }
}
