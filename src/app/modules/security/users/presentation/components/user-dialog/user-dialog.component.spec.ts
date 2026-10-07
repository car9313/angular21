import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';

import { UserDialogComponent } from './user-dialog.component';
import { UserListStore } from '@/app/modules/security/users/presentation/stores/user-list.store';
import { User } from '@/app/modules/security/users/domain/user';
import { Role } from '@/app/modules/security/roles/domain/role';
import { RoleRepository } from '@/app/modules/security/roles/infrastructure/role-repository';
import { SettingsStore } from '@/app/modules/security/settings/presentation/stores/settings.store';
import { SecuritySettings, makeSecuritySettings } from '@/app/modules/security/settings/domain/security-settings';

const supervisor: Role = { id: 7, name: 'Supervisor', isUnEditable: false, isUnDeletable: false, permissions: [] };

const anaRuiz: User = {
    id: 3,
    username: 'aruiz',
    fullName: 'Ana Ruiz',
    isUnEditable: false,
    isUnDeletable: false,
    roles: [supervisor]
};

const roleRepositoryStub = {
    list: vi.fn(() =>
        of({
            objects: [supervisor],
            meta: { currentPage: 1, nextPage: null, prevPage: null, totalPage: 1, totalCount: 1 }
        })
    )
};

/** Settings stub con señal: simula la llegada asíncrona del GET de settings. */
const settingsSignal = signal<SecuritySettings | null>(null);
const settingsStoreStub = {
    current: () => settingsSignal(),
    load: vi.fn()
};

function errorTexts(fixture: ComponentFixture<UserDialogComponent>): string[] {
    const nodes = (fixture.nativeElement as HTMLElement).querySelectorAll('small.text-red-500, .text-red-500 small');
    return Array.from(nodes).map((el) => el.textContent?.trim() ?? '').filter((text) => text.length > 0);
}

function field(fixture: ComponentFixture<UserDialogComponent>, id: string): HTMLInputElement {
    return (fixture.nativeElement as HTMLElement).querySelector(`#${id}`) as HTMLInputElement;
}

function controls(fixture: ComponentFixture<UserDialogComponent>) {
    return fixture.componentInstance['form'].controls;
}

/**
 * Contrato del formulario de usuarios (estándar R1–R4):
 * - R3: un intento de guardar en un formulario vacío revela TODOS los errores.
 * - R1/R2: el estado rojo y el mensaje se revelan con la MISMA condición
 *   (invalid && dirty||touched), sin esperar blur.
 * - Modo edición: contraseña/roles opcionales, prellenado PRISTINE (R4).
 * - La fortaleza de contraseña se lee de settings por GETTER: si el GET
 *   resuelve DESPUÉS de montar, se revalida con la configuración nueva.
 */
describe('UserDialogComponent', () => {
    beforeEach(() => {
        roleRepositoryStub.list.mockClear();
        settingsStoreStub.load.mockClear();
        settingsSignal.set(null);

        TestBed.configureTestingModule({
            imports: [UserDialogComponent],
            providers: [
                provideZonelessChangeDetection(),
                MessageService,
                UserListStore,
                { provide: RoleRepository, useValue: roleRepositoryStub },
                { provide: SettingsStore, useValue: settingsStoreStub }
            ]
        });
    });

    it('requests the missing security settings once and loads the roles catalog', () => {
        TestBed.createComponent(UserDialogComponent);

        expect(settingsStoreStub.load).toHaveBeenCalledTimes(1);
        expect(roleRepositoryStub.list).toHaveBeenCalledTimes(1);
    });

    it('reveals every required error on a save attempt (R3), without firing a request', () => {
        const fixture = TestBed.createComponent(UserDialogComponent);
        fixture.detectChanges();
        TestBed.flushEffects();

        fixture.componentInstance['onSubmit'](); // R3: markAllAsTouched y no persistir
        fixture.detectChanges();

        const texts = errorTexts(fixture);
        expect(texts).toContain('El usuario es requerido.');
        expect(texts).toContain('El nombre es requerido.');
        expect(texts).toContain('La contraseña es requerida.');
        expect(texts).toContain('La confirmación de contraseña es requerida.');
        expect(texts).toContain('Debe seleccionar al menos un rol.');
        expect(fixture.componentInstance['store'].saving()).toBe(false);
    });

    it('keeps the message hidden while the form is pristine (fresh dialog)', () => {
        const fixture = TestBed.createComponent(UserDialogComponent);
        fixture.detectChanges();
        TestBed.flushEffects();

        expect(controls(fixture).username.invalid).toBe(true); // vacío + required…
        expect(errorTexts(fixture)).toEqual([]);               // …pero sin interactuar no se muestra
        // Angular pone ng-invalid solo por estado; sin ng-dirty no hay borde rojo (R1).
        expect(field(fixture, 'username').classList.contains('ng-dirty')).toBe(false);
    });

    it('reveals the username error as soon as it is dirty-invalid, without blur (R1+R2)', () => {
        const fixture = TestBed.createComponent(UserDialogComponent);
        fixture.detectChanges();
        TestBed.flushEffects();

        const username = controls(fixture).username;
        username.markAsDirty();
        username.setValue('');
        fixture.detectChanges();

        expect(errorTexts(fixture)).toContain('El usuario es requerido.');
        expect(field(fixture, 'username').classList.contains('ng-invalid')).toBe(true);
        expect(field(fixture, 'username').classList.contains('ng-dirty')).toBe(true);
    });

    it('lists every broken password rule of the configured policy', () => {
        const fixture = TestBed.createComponent(UserDialogComponent);
        fixture.detectChanges();
        TestBed.flushEffects();

        const password = controls(fixture).password;
        password.setValue('abc');
        password.markAsDirty();
        fixture.detectChanges();

        const texts = errorTexts(fixture);
        expect(texts).toContain('La contraseña debe tener al menos 8 caracteres.');
        expect(texts).toContain('Debe contener al menos una letra mayúscula.');
        expect(texts).toContain('Debe contener al menos un número.');
        expect(texts).toContain('Debe contener al menos un símbolo (!@#$%^&*(),.?":{}|<>).');
    });

    it('flags a mismatched confirmation once the user touched the fields', () => {
        const fixture = TestBed.createComponent(UserDialogComponent);
        fixture.detectChanges();
        TestBed.flushEffects();

        const { password, passwordConfirmation } = controls(fixture);
        password.setValue('Abcdef1!');
        passwordConfirmation.setValue('Abcdef2!');
        passwordConfirmation.markAsTouched();
        fixture.detectChanges();

        expect(fixture.componentInstance['form'].errors?.['passwordMismatch']).toBe(true);
        expect(errorTexts(fixture)).toContain('Las contraseñas no coinciden.');
    });

    it('accepts a fully valid add form (strength + match + roles)', () => {
        const fixture = TestBed.createComponent(UserDialogComponent);
        fixture.detectChanges();
        TestBed.flushEffects();

        const { username, fullName, password, passwordConfirmation, roles } = controls(fixture);
        username.setValue('aruiz');
        fullName.setValue('Ana Ruiz');
        password.setValue('Abcdef1!');
        passwordConfirmation.setValue('Abcdef1!');
        roles.setValue([supervisor]);

        expect(fixture.componentInstance['form'].valid).toBe(true);
        expect(errorTexts(fixture)).toEqual([]);
    });

    it('pre-fills the edit mode, keeps username read-only and starts pristine (R4)', () => {
        const fixture = TestBed.createComponent(UserDialogComponent);
        fixture.componentRef.setInput('user', anaRuiz);
        fixture.detectChanges();
        TestBed.flushEffects();

        expect(field(fixture, 'username').value).toBe('aruiz');
        expect(field(fixture, 'username').readOnly).toBe(true);
        expect(field(fixture, 'fullName').value).toBe('Ana Ruiz');
        expect(controls(fixture).roles.value).toEqual([supervisor]);
        expect(fixture.componentInstance['form'].pristine).toBe(true);
    });

    it('treats an empty password as valid in edit mode (no password change)', () => {
        const fixture = TestBed.createComponent(UserDialogComponent);
        fixture.componentRef.setInput('user', anaRuiz);
        fixture.detectChanges();
        TestBed.flushEffects();

        expect(controls(fixture).password.valid).toBe(true);
        expect(controls(fixture).passwordConfirmation.valid).toBe(true);
        expect(controls(fixture).roles.valid).toBe(true);
        expect(fixture.componentInstance['form'].valid).toBe(true);
    });

    it('revalidates with the real policy when settings resolve after mount', () => {
        const fixture = TestBed.createComponent(UserDialogComponent);
        fixture.detectChanges();
        TestBed.flushEffects();

        const password = controls(fixture).password;
        password.setValue('Abcdef1!'); // válido con el perfil por defecto (min 8)
        expect(password.valid).toBe(true);

        settingsSignal.set(makeSecuritySettings({ passwordSettings: { minLength: 12 } }));
        TestBed.flushEffects();

        expect(password.invalid).toBe(true);
        expect(password.getError('passwordStrength')?.['minlength']).toEqual({ requiredLength: 12, actualLength: 8 });
    });
});
