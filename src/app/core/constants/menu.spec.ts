import { describe, it, expect } from 'vitest';

import { MENU_ITEMS, SecuredMenuItem } from './menu';

function leaves(items: SecuredMenuItem[] = MENU_ITEMS): SecuredMenuItem[] {
    return items.flatMap((item) => (item.items?.length ? leaves(item.items) : [item]));
}

function findByLabel(label: string): SecuredMenuItem[] {
    return leaves().filter((item) => item.label === label);
}

describe('MENU_ITEMS', () => {
    it('exposes a single Países entry pointing at the unaccented route', () => {
        const countries = findByLabel('Países');

        expect(countries).toHaveLength(1);
        expect(countries[0].routerLink).toEqual(['/nomencladores/paises']);
    });

    it('renames the security settings leaf so it does not clash with the Configuración group', () => {
        const settings = findByLabel('Parámetros del sistema');

        expect(settings).toHaveLength(1);
        expect(settings[0].routerLink).toEqual(['/seguridad/configuracion']);
        expect(findByLabel('Configuración')).toHaveLength(0);
    });

    it('does not repeat a router link across leaves', () => {
        const paths = leaves()
            .filter((item) => Array.isArray(item.routerLink))
            .map((item) => (item.routerLink as unknown[]).join('/'));

        expect(new Set(paths).size).toBe(paths.length);
    });
});
