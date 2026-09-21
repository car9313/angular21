// src/app/shared/permissions-tree/permissions-tree.component.ts
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { Tree } from 'primeng/tree';
import type { TreeNode } from 'primeng/api';

@Component({
    selector: 'permissions-tree',
    standalone: true,
    imports: [Tree],
    template: `
        <p-tree [value]="treeData" selectionMode="checkbox" dataKey="key" [propagateSelectionUp]="true" [propagateSelectionDown]="true" [selection]="selectedNodes" (selectionChange)="selectionChange.emit($event)" styleClass="w-full md:w-[30rem]">
        </p-tree>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PermissionsTreeComponent {
    /** Árbol completo ya mapeado */
    @Input() treeData: TreeNode[] = [];

    /** Lista de nodos seleccionados */
    @Input() selectedNodes: TreeNode[] = [];

    /** Emite cuando el usuario marca/desmarca en el árbol */
    @Output() selectionChange = new EventEmitter<TreeNode[] | TreeNode | null>();
}
