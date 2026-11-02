class MemoryStorage implements Storage {
    private readonly items = new Map<string, string>();

    get length(): number {
        return this.items.size;
    }

    clear(): void {
        this.items.clear();
    }

    getItem(key: string): string | null {
        return this.items.get(key) ?? null;
    }

    key(index: number): string | null {
        return Array.from(this.items.keys())[index] ?? null;
    }

    removeItem(key: string): void {
        this.items.delete(key);
    }

    setItem(key: string, value: string): void {
        this.items.set(key, String(value));
    }
}

function installStorage(target: object, property: 'localStorage' | 'sessionStorage'): void {
    if (typeof (target as Record<string, unknown>)[property] !== 'undefined') return;

    Object.defineProperty(target, property, {
        configurable: true,
        value: new MemoryStorage()
    });
}

installStorage(globalThis, 'localStorage');
installStorage(globalThis, 'sessionStorage');

if (typeof window !== 'undefined') {
    installStorage(window, 'localStorage');
    installStorage(window, 'sessionStorage');
}
