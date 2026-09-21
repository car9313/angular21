// shared/services/select-cache.service.ts
import { Injectable } from '@angular/core';

export interface CacheData {
    items: unknown[];
    cursor: string | null;
    hasMore: boolean;
}

@Injectable({ providedIn: 'root' })
export class SelectCacheService {
    private cache = new Map<string, CacheData>();

    get(key: string): CacheData | null {
        return this.cache.get(key) || null;
    }

    set(key: string, data: CacheData): void {
        this.cache.set(key, data);
    }

    clear(key: string): void {
        this.cache.delete(key);
    }

    clearAll(): void {
        this.cache.clear();
    }
}
