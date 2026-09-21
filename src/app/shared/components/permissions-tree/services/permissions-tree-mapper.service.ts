import { Injectable } from '@angular/core';
import type { TreeNode } from 'primeng/api';
import { PermissionsCategory } from '../domain/permissions-category.interface';

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
                key: `${cat.category}_${p.resource}`,
                selectable: true,
                icon: 'pi pi-fw pi-cog', // icono para recurso
                children: p.actions.map((a) => ({
                    label: a,
                    key: `${cat.category}_${p.resource}_${a}`,
                    selectable: true,
                    icon: 'pi pi-star' // icono para acción
                }))
            }))
        }));
    }

    /**
     * Dado el árbol y las claves asignadas, devuelve solo las hojas seleccionadas,
     * los recursos completos y las categorías completas.
     */
    computeSelectedNodes(nodes: TreeNode[], assignedKeys: string[]): TreeNode[] {
        const leaves = this.getLeaves(nodes, assignedKeys);
        const resourceNodes = nodes.flatMap((cat) => (cat.children ?? []).filter((perm) => (perm.children ?? []).every((a) => leaves.some((l) => l.key === a.key))));
        const categoryNodes = nodes.filter((cat) => (cat.children ?? []).every((p) => resourceNodes.some((r) => r.key === p.key)));
        return [...leaves, ...resourceNodes, ...categoryNodes];
    }
    /** Devuelve únicamente las hojas (nodos de acción) cuyos keys estén en assignedKeys */
    getLeaves(nodes: TreeNode[], assignedKeys: string[]): TreeNode[] {
        return nodes
            .flatMap((cat) => cat.children ?? [])
            .flatMap((perm) => perm.children ?? [])
            .filter((action) => assignedKeys.includes(action.key!));
    }
}
