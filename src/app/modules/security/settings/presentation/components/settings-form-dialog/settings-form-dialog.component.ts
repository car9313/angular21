// src/app/modules/security/settings/presentation/components/settings-form-dialog/settings-form-dialog.component.ts
import { ChangeDetectionStrategy, Component, ViewChild, computed, inject, input, output, signal } from '@angular/core';
import { Dialog } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

import { LockOutSettings, PasswordSettings, SecuritySettings, UserSettings, securitySettingsEqual } from '../../../domain/security-settings';
import { SettingsStore } from '../../stores/settings.store';
import { GeneralSectionComponent, GeneralSettingsSlice } from '../general-section/general-section.component';
import { AuthSectionComponent } from '../auth-section/auth-section.component';
import { PasswordSectionComponent } from '../password-section/password-section.component';
import { UserSectionComponent } from '../user-section/user-section.component';

/**
 * Edit dialog for the security settings.
 *
 * Presentational assembler: the four section components own their FORMS; this
 * dialog only
 * - hands each section its typed slice of the loaded settings,
 * - collects the slices + validity signals emitted by the sections,
 * - computes `dirty` with the typed `securitySettingsEqual` (never JSON),
 *   and emits `saved` (assembled entity) / `cancelled`.
 * The page decides when to persist and what to notify.
 */
@Component({
    selector: 'app-settings-form-dialog',
    standalone: true,
    imports: [Dialog, ButtonModule, GeneralSectionComponent, AuthSectionComponent, PasswordSectionComponent, UserSectionComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <p-dialog
            [visible]="visible()"
            (visibleChange)="visible.set($event)"
            (onHide)="cancelled.emit()"
            [modal]="true"
            [closable]="!store.saving()"
            [closeOnEscape]="!store.saving()"
            [focusOnShow]="true"
            [style]="{ width: '800px' }"
            [header]="'Modificación de ajustes de seguridad'"
        >
            <div class="flex flex-col gap-4">
                <app-general-section #general [settings]="generalSlice()" (valueChange)="onGeneralChange($event)" (valid)="onGeneralValid($event)" />
                <app-auth-section #auth [settings]="authSlice()" (valueChange)="onAuthChange($event)" (valid)="onAuthValid($event)" />
                <app-password-section #password [settings]="passwordSlice()" (valueChange)="onPasswordChange($event)" (valid)="onPasswordValid($event)" />
                <app-user-section #user [settings]="userSlice()" (valueChange)="onUserChange($event)" (valid)="onUserValid($event)" />
            </div>

            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" [text]="true" [disabled]="store.saving()" type="button" (onClick)="cancelled.emit()" />
                <p-button label="Guardar" icon="pi pi-check" [loading]="store.saving()" [disabled]="store.saving() || !dirty()" (onClick)="onSubmit()" />
            </ng-template>
        </p-dialog>
    `
})
export class SettingsFormDialogComponent {
    /** Baseline loaded from the root store (mounted only when it exists). */
    readonly settings = input.required<SecuritySettings>();

    readonly saved = output<SecuritySettings>();
    readonly cancelled = output<void>();

    @ViewChild('general') protected readonly generalSection?: GeneralSectionComponent;
    @ViewChild('auth') protected readonly authSection?: AuthSectionComponent;
    @ViewChild('password') protected readonly passwordSection?: PasswordSectionComponent;
    @ViewChild('user') protected readonly userSection?: UserSectionComponent;

    protected readonly store = inject(SettingsStore);

    /** Controlado por nosotros: el montaje lo gobierna la página, el cierre no. */
    protected readonly visible = signal(true);

    /** Typed slices handed to each section (derived from the baseline). */
    protected readonly generalSlice = computed<GeneralSettingsSlice>(() => ({
        accessTokenExpireMinute: this.settings().accessTokenExpireMinute,
        sessionExpireMinute: this.settings().sessionExpireMinute
    }));
    protected readonly authSlice = computed<LockOutSettings>(() => this.settings().lockOutSettings);
    protected readonly passwordSlice = computed<PasswordSettings>(() => this.settings().passwordSettings);
    protected readonly userSlice = computed<UserSettings>(() => this.settings().userSettings);

    /** Latest emitted value of each section (null until every section seeds). */
    private readonly generalValue = signal<GeneralSettingsSlice | null>(null);
    private readonly authValue = signal<LockOutSettings | null>(null);
    private readonly passwordValue = signal<PasswordSettings | null>(null);
    private readonly userValue = signal<UserSettings | null>(null);

    private readonly generalValid = signal(false);
    private readonly authValid = signal(false);
    private readonly passwordValid = signal(false);
    private readonly userValid = signal(false);

    /** Master entity assembled from the four section values. */
    protected readonly current = computed<SecuritySettings | null>(() => {
        const general = this.generalValue();
        const auth = this.authValue();
        const password = this.passwordValue();
        const user = this.userValue();
        if (!general || !auth || !password || !user) {
            return null;
        }
        return {
            accessTokenExpireMinute: general.accessTokenExpireMinute,
            sessionExpireMinute: general.sessionExpireMinute,
            lockOutSettings: auth,
            passwordSettings: password,
            userSettings: user
        };
    });

    /** Dirty when assembled != baseline (typed deep-equality, never JSON). */
    protected readonly dirty = computed(() => {
        const current = this.current();
        return current !== null && !securitySettingsEqual(current, this.settings());
    });

    protected readonly valid = computed(() => this.generalValid() && this.authValid() && this.passwordValid() && this.userValid());

    protected onGeneralChange(value: GeneralSettingsSlice): void {
        this.generalValue.set(value);
    }

    protected onGeneralValid(value: boolean): void {
        this.generalValid.set(value);
    }

    protected onAuthChange(value: LockOutSettings): void {
        this.authValue.set(value);
    }

    protected onAuthValid(value: boolean): void {
        this.authValid.set(value);
    }

    protected onPasswordChange(value: PasswordSettings): void {
        this.passwordValue.set(value);
    }

    protected onPasswordValid(value: boolean): void {
        this.passwordValid.set(value);
    }

    protected onUserChange(value: UserSettings): void {
        this.userValue.set(value);
    }

    protected onUserValid(value: boolean): void {
        this.userValid.set(value);
    }

    protected onSubmit(): void {
        const current = this.current();
        if (!current || !this.dirty()) {
            return;
        }
        if (!this.valid()) {
            this.markAllSectionsTouched();
            return;
        }
        this.saved.emit(current);
    }

    /** Option B: revealing all validation errors in one pass (no per-keystroke sync). */
    private markAllSectionsTouched(): void {
        this.generalSection?.markAllTouched();
        this.authSection?.markAllTouched();
        this.passwordSection?.markAllTouched();
        this.userSection?.markAllTouched();
    }
}