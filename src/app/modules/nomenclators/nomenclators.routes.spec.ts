import { describe, it, expect } from 'vitest';

import { nomenclatorRoutes } from './nomenclators.routes';
import { RESOURCES } from '@/app/core/constants/resources';

describe('nomenclatorRoutes', () => {
    it('serves the countries page under the unaccented paises path with its RBAC resource', () => {
        const route = nomenclatorRoutes.find((r) => r.path === 'paises');

        expect(route).toBeTruthy();
        expect(route?.data?.['resource']).toBe(RESOURCES.Nomenclators);
        expect(route?.canActivate?.length).toBe(1);
    });

    it('keeps the accented path as a backwards-compatible redirect', () => {
        const legacy = nomenclatorRoutes.find((r) => r.path === 'países');

        expect(legacy?.redirectTo).toBe('paises');
        expect(legacy?.pathMatch).toBe('full');
    });

    it('sends unknown nomenclator paths to the existing notfound page', () => {
        const wildcard = nomenclatorRoutes.find((r) => r.path === '**');

        expect(wildcard?.redirectTo).toBe('/notfound');
    });
});
