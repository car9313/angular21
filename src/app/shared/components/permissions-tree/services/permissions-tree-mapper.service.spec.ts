import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import type { TreeNode } from 'primeng/api';

import { PermissionsTreeMapperService } from './permissions-tree-mapper.service';
import { PermissionsCategory } from '../domain/permissions-category.interface';
import { AppPermissionsCategory } from '@/app/modules/security/roles/domain/role';

const catalog: PermissionsCategory[] = [
    {
        category: 'Usuarios',
        permissions: [
            { resource: 'users', description: 'Usuarios', actions: ['Leer', 'Crear'] },
            { resource: 'roles', description: 'Roles', actions: ['Leer'] }
        ]
    },
    {
        category: 'Inventario',
        permissions: [{ resource: 'products', description: 'Productos', actions: ['Leer', 'Eliminar'] }]
    }
];

describe('PermissionsTreeMapperService', () => {
    let service: PermissionsTreeMapperService;

    beforeEach(() => {
        service = TestBed.inject(PermissionsTreeMapperService);
    });

    describe('mapToTreeNodes', () => {
        function nodes(): TreeNode[] {
            return service.mapToTreeNodes(catalog);
        }

        it('builds 3 levels: category -> resource -> action', () => {
            const tree = nodes();
            expect(tree).toHaveLength(2);
            expect(tree[0]?.children?.map((n) => n.label)).toEqual(['Usuarios', 'Roles']);
            expect(tree[0]?.children?.[0]?.children?.map((n) => n.label)).toEqual(['Leer', 'Crear']);
        });

        it('attaches structured data (resource/actionType) to every action leaf', () => {
            const leaf = nodes()[0]?.children?.[0]?.children?.[0];
            expect(leaf?.data).toEqual({ resource: 'users', actionType: 'Leer' });
        });

        it('attaches resource data to intermediate resource nodes', () => {
            const resourceNode = nodes()[0]?.children?.[0];
            expect(resourceNode?.data).toEqual({ resource: 'users' });
        });

        it('keeps composite keys stable for dataKey identity', () => {
            const leaf = nodes()[1]?.children?.[0]?.children?.[0];
            expect(leaf?.key).toBe('Inventario_products_Leer');
        });
    });

    describe('collectAssignedKeys', () => {
        it('flattens backend role permissions into the matching leaf keys', () => {
            const rolePermissions: AppPermissionsCategory[] = [
                { category: 'Usuarios', permissions: [{ resource: 'users', description: 'Usuarios', actions: ['Leer'] }] }
            ];

            expect(service.collectAssignedKeys(rolePermissions)).toEqual(['Usuarios_users_Leer']);
        });

        it('returns empty when the role has no permissions', () => {
            expect(service.collectAssignedKeys([])).toEqual([]);
        });
    });

    describe('computeSelectedNodes', () => {
        it('returns leaves, complete resources and complete categories', () => {
            const tree = service.mapToTreeNodes(catalog);
            const selected = service.computeSelectedNodes(tree, ['Usuarios_users_Leer', 'Usuarios_users_Crear', 'Usuarios_roles_Leer']);

            expect(selected.map((n) => n.key)).toContain('Usuarios_users_Leer');
            expect(selected.map((n) => n.key)).toContain('Usuarios_users_Crear');
            expect(selected.map((n) => n.key)).toContain('Usuarios_roles_Leer');
            // Usuarios: ambos recursos completos -> la categoría también
            expect(selected.map((n) => n.key)).toContain('Usuarios');
            expect(selected.map((n) => n.key)).not.toContain('Inventario');
        });

        it('does not mark a resource complete when only one action is assigned', () => {
            const tree = service.mapToTreeNodes(catalog);
            const selected = service.computeSelectedNodes(tree, ['Usuarios_users_Leer']);

            expect(selected.map((n) => n.key)).toContain('Usuarios_users_Leer');
            expect(selected.map((n) => n.key)).not.toContain('Usuarios_users');
            expect(selected.map((n) => n.key)).not.toContain('Usuarios');
        });

        it('handles an empty assignment set', () => {
            const selected = service.computeSelectedNodes(service.mapToTreeNodes(catalog), []);
            expect(selected).toEqual([]);
        });
    });

    describe('getLeaves', () => {
        it('returns only action nodes whose keys are assigned', () => {
            const leaves = service.getLeaves(service.mapToTreeNodes(catalog), ['Usuarios_users_Crear']);

            expect(leaves.map((n) => n.key)).toEqual(['Usuarios_users_Crear']);
        });
    });

    describe('leavesToPayload', () => {
        it('maps only leaf nodes to {resource, actionType}, dropping parents', () => {
            const tree = service.mapToTreeNodes(catalog);
            const selected = service.computeSelectedNodes(tree, ['Usuarios_users_Leer', 'Usuarios_users_Crear', 'Usuarios_roles_Leer']);

            const payload = service.leavesToPayload(selected);

            expect(payload).toEqual([
                { resource: 'users', actionType: 'Leer' },
                { resource: 'users', actionType: 'Crear' },
                { resource: 'roles', actionType: 'Leer' }
            ]);
        });

        it('throws when a leaf node lacks structured data', () => {
            const broken = [{ key: 'a_b_c', label: 'X' } as TreeNode];
            expect(() => service.leavesToPayload(broken)).toThrow(/lacks structured data/);
        });

        it('returns empty payload for an empty selection', () => {
            expect(service.leavesToPayload([])).toEqual([]);
        });
    });
});