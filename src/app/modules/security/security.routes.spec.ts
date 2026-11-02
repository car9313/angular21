import { describe, it, expect } from 'vitest';

import { securityRoutes } from './security.routes';
import rolesRoutes from './roles/roles.routes';
import usersRoutes from './users/users.routes';
import auditRoutes from './audits/audit.routes';
import settingsRoutes from './settings/settings.routes';
import { RESOURCES } from '@/app/core/constants/resources';
import { ACTIONS } from '@/app/core/constants/actions';
import { CONST_ROUTES } from '@/app/core/constants/route-paths';

describe('securityRoutes', () => {
    it('mounts each security feature under its own path', () => {
        const paths = securityRoutes.map((route) => route.path);

        expect(paths).toContain(CONST_ROUTES.roles);
        expect(paths).toContain(CONST_ROUTES.usuarios);
        expect(paths).toContain(CONST_ROUTES.auditorias);
        expect(paths).toContain(CONST_ROUTES.configuracion);
    });

    it('lazy loads every security feature', () => {
        const features = securityRoutes.filter((route) => typeof route.loadChildren === 'function');

        expect(features.length).toBe(4);
        features.forEach((route) => expect(typeof route.loadChildren).toBe('function'));
    });

    it('redirects /seguridad to roles and unknown security paths to notfound', () => {
        const empty = securityRoutes.find((route) => route.path === '');
        const wildcard = securityRoutes.find((route) => route.path === '**');

        expect(empty?.redirectTo).toBe(CONST_ROUTES.roles);
        expect(empty?.pathMatch).toBe('full');
        expect(wildcard?.redirectTo).toBe('/notfound');
    });

    it('protects roles and users with the Read action of their own resource', () => {
        expect(rolesRoutes[0].data?.['resource']).toBe(RESOURCES.Roles);
        expect(rolesRoutes[0].data?.['actions']).toEqual([ACTIONS.Read]);
        expect(usersRoutes[0].data?.['resource']).toBe(RESOURCES.Users);
        expect(usersRoutes[0].data?.['actions']).toEqual([ACTIONS.Read]);
    });

    it('protects audits with Read and settings with Update', () => {
        expect(auditRoutes[0].data?.['resource']).toBe(RESOURCES.Audits);
        expect(auditRoutes[0].data?.['actions']).toEqual([ACTIONS.Read]);
        expect(settingsRoutes[0].data?.['resource']).toBe(RESOURCES.SecConfig);
        expect(settingsRoutes[0].data?.['actions']).toEqual([ACTIONS.Update]);
    });

    it('declares title and breadcrumb on every page route', () => {
        [rolesRoutes, usersRoutes, auditRoutes, settingsRoutes].forEach((routes) => {
            expect(routes[0].data?.['title']).toBeTruthy();
            expect(routes[0].data?.['breadcrumb']).toBeTruthy();
        });
    });
});
