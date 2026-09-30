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
});
