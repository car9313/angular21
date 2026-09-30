import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Observable } from 'rxjs';
import { MessageService } from 'primeng/api';
import type { TreeNode } from 'primeng/api';

import { RolePermissionsDialogComponent } from './role-permissions-dialog.component';
import { RoleRepository } from '../../../infrastructure/role-repository';
import { Role } from '../../../domain/role';

const role: Role = {
    id: 7,
    name: 'Supervisor',
    isUnEditable: false,
    isUnDeletable: false,
    permissions: []
};

const catalog = [
    { category: 'Usuarios', permissions: [{ resource: 'users', description: 'Usuarios', actions: ['Leer', 'Crear'] }] }
];

const rolePermissions = [
    { category: 'Usuarios', permissions: [{ resource: 'users', description: 'Usuarios', actions: ['Leer'] }] }
];

/** Observable que resuelve en un microtask: permite asertar el estado "en vuelo". */
function asyncValue<T>(value: T): Observable<T> {
    return new Observable((subscriber) => {
        queueMicrotask(() => {
            subscriber.next(value);
            subscriber.complete();
        });
    });
}

async function settle(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
}

describe('RolePermissionsDialogComponent', () => {
    let repository: {
        getPermissionsCatalog: ReturnType<typeof vi.fn>;
        getPermissionsByRole: ReturnType<typeof vi.fn>;
        updatePermissions: ReturnType<typeof vi.fn>;
    };
    let fixture: ComponentFixture<RolePermissionsDialogComponent>;
    let component: RolePermissionsDialogComponent;

    beforeEach(() => {
        repository = {
            getPermissionsCatalog: vi.fn(() => asyncValue(catalog)),
            getPermissionsByRole: vi.fn(() => asyncValue(rolePermissions)),
            updatePermissions: vi.fn(() => asyncValue(undefined))
        };

        TestBed.configureTestingModule({
            imports: [RolePermissionsDialogComponent],
            providers: [provideZonelessChangeDetection(), MessageService, { provide: RoleRepository, useValue: repository }]
        });

        fixture = TestBed.createComponent(RolePermissionsDialogComponent);
        component = fixture.componentInstance;
    });

    it('loads role permissions on open and seeds the tree after data arrives', async () => {
        fixture.componentRef.setInput('role', role);
        fixture.detectChanges();
        await settle();
        fixture.detectChanges();

        expect(repository.getPermissionsCatalog).toHaveBeenCalledTimes(1);
        expect(repository.getPermissionsByRole).toHaveBeenCalledWith(7);
        // Selección sembrada: la hoja 'Leer' asignada aparece seleccionada.
        expect(component['selection']().map((n) => n.key)).toContain('Usuarios_users_Leer');
    });

    it('saves the current selection on submit and emits saved', async () => {
        fixture.componentRef.setInput('role', role);
        fixture.detectChanges();
        await settle();
        fixture.detectChanges();

        // Simula toggle del usuario: marca 'Crear' además de 'Leer'.
        component['selection'].set([
            { key: 'Usuarios_users_Leer', data: { resource: 'users', actionType: 'Leer' } },
            { key: 'Usuarios_users_Crear', data: { resource: 'users', actionType: 'Crear' } }
        ] as TreeNode[]);

        const saved = vi.fn();
        component.saved.subscribe(saved);

        component['onSubmit']();
        await settle();

        expect(repository.updatePermissions).toHaveBeenCalledWith(7, [
            { resource: 'users', actionType: 'Leer' },
            { resource: 'users', actionType: 'Crear' }
        ]);
        expect(saved).toHaveBeenCalledTimes(1);
    });

    it('renders loading state while the store is loading', () => {
        fixture.componentRef.setInput('role', role);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('p-progressspinner') ?? fixture.nativeElement.querySelector('[class*="p-progressspinner"]')).toBeDefined();
    });
});