import { Injectable } from '@angular/core';
import type { TreeNode } from 'primeng/api';
import { PermissionsCategory } from '../domain/permissions-category.interface';
import { AppPermissionsCategory } from '@/app/modules/security/roles/domain/role';

export interface PermissionActionPayload {
    resource: string;
    actionType: string;
}

const SEPARATOR = '_';

/**
 * Puente entre el tree de PrimeNG y los DTOs del backend de permisos.
 *
 * La clave de cada hoja es compuesta (`{categoria}_{recurso}_{accion}`) SOLO
 * como identidad estable para `dataKey`/comparaciones. El payload de guardado
 * NUNCA se deriva de la clave: cada hoja lleva `data` estructurado
 * (`resource` + `actionType`), así los nombres no dependen del separador.
 */
@Injectable({ providedIn: 'root' })
export class PermissionsTreeMapperService {
    /**
     * Transforma un catálogo de PermissionsCategory[] en TreeNode[]
     * con categorías, recursos y acciones marcadas como seleccionables.
     */
    mapToTreeNodes(categories: PermissionsCategory[]): TreeNode[] {
        return categories.map((cat) => ({
            label: cat.category,
            key: cat.category,
            selectable: true,
            icon: 'pi pi-fw pi-sitemap', // icono para categoría
            children: cat.permissions.map((p) => ({
                label: p.description,
                key: `${cat.category}${SEPARATOR}${p.resource}`,
                selectable: true,
                icon: 'pi pi-fw pi-cog', // icono para recurso
                data: { resource: p.resource },
                children: p.actions.map((a) => ({
                    label: a,
                    key: `${cat.category}${SEPARATOR}${p.resource}${SEPARATOR}${a}`,
                    selectable: true,
                    icon: 'pi pi-star', // icono para acción
                    // Payload directo: no se parsea la clave al guardar.
                    data: { resource: p.resource, actionType: a }
                }))
            }))
        }));
    }

    /**
     * Deriva las claves de hojas ya asignadas al rol desde el shape del backend
     * (mismas categorías, pero solo los permisos/acciones que el rol posee).
     * O(permisos × acciones) — un solo aplanado, sin búsquedas anidadas.
     */
    collectAssignedKeys(rolePermissions: AppPermissionsCategory[]): string[] {
        return rolePermissions.flatMap((cat) =>
            cat.permissions.flatMap((p) =>
                p.actions.map((action) => `${cat.category}${SEPARATOR}${p.resource}${SEPARATOR}${action}`)
            )
        );
    }

    /**
     * Dado el árbol y las claves asignadas, devuelve las hojas seleccionadas,
     * los recursos completos y las categorías completas (state tri-state visual).
     *
     * Optimización: `assigned` se materializa en un Set (O(1) por look-up) en
     * lugar de `.some()` lineales anidados por nivel.
     */
    computeSelectedNodes(nodes: TreeNode[], assignedKeys: string[]): TreeNode[] {
        const assigned = new Set(assignedKeys);

        const leaves = nodes
            .flatMap((cat) => cat.children ?? [])
            .flatMap((perm) => perm.children ?? [])
            .filter((action) => assigned.has(action.key!));
        const resourceNodes = nodes.flatMap((cat) =>
            (cat.children ?? []).filter((perm) => (perm.children ?? []).every((a) => assigned.has(a.key!)))
        );
        const categoryNodes = nodes.filter((cat) =>
            (cat.children ?? []).every((p) => resourceNodes.some((r) => r.key === p.key))
        );

        return [...leaves, ...resourceNodes, ...categoryNodes];
    }

    /** Devuelve únicamente las hojas (nodos de acción) cuyos keys estén en assignedKeys */
    getLeaves(nodes: TreeNode[], assignedKeys: string[]): TreeNode[] {
        const assigned = new Set(assignedKeys);
        return nodes
            .flatMap((cat) => cat.children ?? [])
            .flatMap((perm) => perm.children ?? [])
            .filter((action) => assigned.has(action.key!));
    }

    /**
     * Payload del guardado: SOLO las hojas seleccionadas → { resource, actionType }.
     * Los nodos intermedios (categoría/recurso) se descartan: el backend reemplaza
     * el set completo del rol, y las acciones de las hojas son la verdad atómica.
     */
    leavesToPayload(selectedNodes: TreeNode[]): PermissionActionPayload[] {
        return selectedNodes
            .filter((node) => !node.children || node.children.length === 0)
            .map((node) => {
                const data = node.data as { resource?: string; actionType?: string };
                if (!data?.resource || !data?.actionType) {
                    throw new Error(`PermissionsTreeMapper#leavesToPayload: node "${node.key}" lacks structured data.`);
                }
                return { resource: data.resource, actionType: data.actionType };
            });
    }
}