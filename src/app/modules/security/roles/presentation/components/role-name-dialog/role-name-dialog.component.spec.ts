import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { MessageService } from 'primeng/api';
import { RoleNameDialogComponent } from './role-name-dialog.component';
import { RoleListStore } from '@/app/modules/security/roles/presentation/stores/role-list.store';
import { Role } from '@/app/modules/security/roles/domain/role';

const supervisor: Role = {
    id: 7,
    name: 'Supervisor',
    isUnEditable: false,
    isUnDeletable: false,
    permissions: []
};

function nameField(fixture: ComponentFixture<RoleNameDialogComponent>): HTMLInputElement {
    return (fixture.nativeElement as HTMLElement).querySelector('#role-name') as HTMLInputElement;
}

function errorMessage(fixture: ComponentFixture<RoleNameDialogComponent>): string | null {
    const el = (fixture.nativeElement as HTMLElement).querySelector('small.text-red-500');
    return el?.textContent?.trim() ?? null;
}

/**
 * Regression: edit mode used to open the dialog with an EMPTY name field
 * because the form was never seeded from the `role` input.
 */
describe('RoleNameDialogComponent', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [RoleNameDialogComponent],
            providers: [provideZonelessChangeDetection(), MessageService, RoleListStore]
        });
    });

    it('pre-fills the name field with the current role value on edit', () => {
        const fixture = TestBed.createComponent(RoleNameDialogComponent);
        fixture.componentRef.setInput('role', supervisor);
        fixture.detectChanges();
        TestBed.flushEffects();

        expect(nameField(fixture).value).toBe('Supervisor');
    });

    it('starts empty when no role is passed (create mode)', () => {
        const fixture = TestBed.createComponent(RoleNameDialogComponent);
        fixture.detectChanges();
        TestBed.flushEffects();

        expect(nameField(fixture).value).toBe('');
    });

    it('reflects a late-arriving role input (sync is reactive, not one-shot)', () => {
        const fixture = TestBed.createComponent(RoleNameDialogComponent);
        fixture.componentRef.setInput('role', null);
        fixture.detectChanges();
        TestBed.flushEffects();
        expect(nameField(fixture).value).toBe('');

        fixture.componentRef.setInput('role', supervisor);
        fixture.detectChanges();
        TestBed.flushEffects();
        expect(nameField(fixture).value).toBe('Supervisor');
    });

    /**
     * Regression (2026-10-07): el borde se ponía rojo con `dirty` pero el
     * mensaje esperaba solo `touched` → "solo aparecía al hacer click fuera".
     * R2 exige la MISMA condición que R1: `invalid && (dirty || touched)`.
     */
    it('reveals the error message as soon as the field is dirty-invalid, without blur', () => {
        const fixture = TestBed.createComponent(RoleNameDialogComponent);
        fixture.detectChanges();
        TestBed.flushEffects();

        const control = fixture.componentInstance['form'].controls.name;
        control.setValue('x');
        control.markAsDirty();
        control.setValue(''); // queda inválida (required) y dirty, SIN tocarla (touched=false)
        expect(control.touched).toBe(false);
        fixture.detectChanges();

        expect(errorMessage(fixture)).toBe('El nombre es requerido.');
        // El par ng-invalid + ng-dirty es lo que enciende el borde rojo (R1).
        expect(nameField(fixture).classList.contains('ng-invalid')).toBe(true);
        expect(nameField(fixture).classList.contains('ng-dirty')).toBe(true);
    });

    it('keeps the message hidden while the field is pristine (fresh dialog)', () => {
        const fixture = TestBed.createComponent(RoleNameDialogComponent);
        fixture.detectChanges();
        TestBed.flushEffects();

        const control = fixture.componentInstance['form'].controls.name;
        expect(control.invalid).toBe(true); // vacío + required, pero sin interactuar
        expect(errorMessage(fixture)).toBeNull();
        // Angular pone ng-invalid solo por estado; sin ng-dirty no hay borde rojo.
        expect(nameField(fixture).classList.contains('ng-dirty')).toBe(false);
    });
});
