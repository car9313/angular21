// src/app/modules/security/settings/presentation/components/settings-detail/settings-detail.component.ts
import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { FieldsetModule } from 'primeng/fieldset';
import { ProgressSpinner } from 'primeng/progressspinner';
import { ConfirmationService } from 'primeng/api';

import { SettingsStore } from '../../stores/settings.store';
import { HasPermissionDirective } from '@/app/shared/directives/has-permission.directive';
import { RESOURCES } from '@/app/core/constants/resources';
import { ACTIONS } from '@/app/core/constants/actions';

/**
 * Read-only display of the security settings.
 *
 * Presentational over the ROOT SettingsStore: loading -> spinner, error ->
 * message + Retry (store.load()), otherwise the four read-only groups and the
 * Edit button. The Edit button is permission-gated (SecConfig + Actualizar)
 * and protected by ConfirmationService BEFORE emitting `edit` — the page
 * decides what to do next.
 */
@Component({
    selector: 'app-settings-detail',
    standalone: true,
    imports: [ButtonModule, FieldsetModule, ProgressSpinner, HasPermissionDirective],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        @if (store.loading()) {
            <div class="flex justify-center p-6">
                <p-progressspinner styleClass="w-8 h-8"></p-progressspinner>
            </div>
        } @else if (store.error(); as error) {
            <div class="flex flex-col items-center gap-3 p-4">
                    <p class="text-red-500 dark:text-red-400 text-center">{{ error }}</p>
                <p-button label="Reintentar" icon="pi pi-refresh" severity="secondary" (onClick)="store.load()" />
            </div>
        } @else if (store.current(); as settings) {
            <div class="flex flex-col gap-4">
                <p-fieldset legend="Configuración general" toggleable="true">
                    <div class="grid grid-cols-2 gap-5">
                        <div class="flex gap-2 items-center">
                            <span class="font-bold">Tiempo de validez de token de acceso (minutos):</span>
                            <span class="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{{ settings.accessTokenExpireMinute }}</span>
                        </div>
                        <div class="flex gap-2 items-center">
                            <span class="font-bold">Tiempo de inactividad de sesión (minutos):</span>
                            <span class="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{{ settings.sessionExpireMinute }}</span>
                        </div>
                    </div>
                </p-fieldset>

                <p-fieldset legend="Configuración de autenticación" toggleable="true">
                    <div class="grid grid-cols-2 gap-5">
                        <div class="flex gap-2 items-center">
                            <span class="font-bold">Intentos fallidos máximos:</span>
                            <span class="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{{ settings.lockOutSettings.maxAttempts }}</span>
                        </div>
                        <div class="flex gap-2 items-center">
                            <span class="font-bold">Tiempo de bloqueo (minutos):</span>
                            <span class="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{{ settings.lockOutSettings.lockOutTimeMinutes }}</span>
                        </div>
                    </div>
                </p-fieldset>

                <p-fieldset legend="Configuración de contraseña" toggleable="true">
                    <div class="grid grid-cols-2 gap-5">
                        <div class="flex gap-2 items-center">
                            <span class="font-bold">Tiempo de validez (días):</span>
                            <span class="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{{ settings.passwordSettings.validDays }}</span>
                        </div>
                        <div class="flex gap-2 items-center">
                            <span class="font-bold">Cantidad de contraseñas en el historial:</span>
                            <span class="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{{ settings.passwordSettings.historyMinCount }}</span>
                        </div>
                        <!-- La referencia renderizaba "Contraseña por defecto" DOS veces (bug): aquí va UNA sola. -->
                        <div class="flex gap-2 items-center">
                            <span class="font-bold">Contraseña por defecto:</span>
                            <span class="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{{ settings.passwordSettings.passwordDefaultValue }}</span>
                        </div>
                        <div class="flex gap-2 items-center">
                            <span class="font-bold">Longitud mínima:</span>
                            <span class="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{{ settings.passwordSettings.minLength }}</span>
                        </div>
                        <div class="flex gap-2 items-center">
                            <span class="font-bold">Requerir mayúsculas:</span>
                            <span class="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{{ settings.passwordSettings.requiresUppercase ? 'Sí' : 'No' }}</span>
                        </div>
                        <div class="flex gap-2 items-center">
                            <span class="font-bold">Requerir minúsculas:</span>
                            <span class="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{{ settings.passwordSettings.requiresLowercase ? 'Sí' : 'No' }}</span>
                        </div>
                        <div class="flex gap-2 items-center">
                            <span class="font-bold">Requerir números:</span>
                            <span class="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{{ settings.passwordSettings.requiresDigits ? 'Sí' : 'No' }}</span>
                        </div>
                        <div class="flex gap-2 items-center">
                            <span class="font-bold">Requerir caracteres especiales:</span>
                            <span class="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{{ settings.passwordSettings.requiresSpecialChars ? 'Sí' : 'No' }}</span>
                        </div>
                    </div>
                </p-fieldset>

                <p-fieldset legend="Configuración de usuario" toggleable="true">
                    <div class="flex gap-2 items-center">
                        <span class="font-bold">Cantidad mínima de caracteres del nombre de usuario:</span>
                        <span class="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{{ settings.userSettings.usernameMinLength }}</span>
                    </div>
                </p-fieldset>

                <div class="flex justify-end">
                    <p-button
                        *appHasPermission="let ok; resource: RESOURCES.SecConfig; actions: editActions"
                        variant="outlined"
                        severity="warn"
                        label="Editar"
                        icon="pi pi-pencil"
                        (onClick)="handleEdit()"
                    />
                </div>
            </div>
        }
    `
})
export class SettingsDetailComponent {
    readonly edit = output<void>();

    protected readonly store = inject(SettingsStore);
    private readonly confirm = inject(ConfirmationService);

    protected readonly RESOURCES = RESOURCES;
    protected readonly editActions = [ACTIONS.Update];

    handleEdit(): void {
        this.confirm.confirm({
            message: '¿Modificar los ajustes de seguridad?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => this.edit.emit()
        });
    }
}