// src/app/modules/security/settings/presentation/settings.page.ts
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';

import { SettingsStore } from '@/app/modules/security/settings/presentation/stores/settings.store';
import { SettingsDetailComponent } from '@/app/modules/security/settings/presentation/components/settings-detail/settings-detail.component';
import { SettingsFormDialogComponent } from '@/app/modules/security/settings/presentation/components/settings-form-dialog/settings-form-dialog.component';
import { SecuritySettings } from '@/app/modules/security/settings/domain/security-settings';
import { NotificationService } from '@/app/core/services/notification-services';

/**
 * Settings page: detail + edit dialog + confirm dialog.
 *
 * The store is NOT listed in providers — it is a root-scoped singleton (any
 * future consumer reads the same instance). The page owns the `editing`
 * signal and the save orchestration (presentational components never touch
 * HTTP).
 */
@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [SettingsDetailComponent, SettingsFormDialogComponent, ConfirmDialog],
    providers: [ConfirmationService],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="card flex flex-col gap-8">
            <app-settings-detail (edit)="onEdit()" />

            @if (editing()) {
                @if (store.current(); as settings) {
                    <app-settings-form-dialog
                        [settings]="settings"
                        (saved)="onSaved($event)"
                        (cancelled)="onCancel()"
                    />
                }
            }

            <p-confirm-dialog [style]="{ width: '450px' }" />
        </div>
    `
})
export class SettingsPage implements OnInit {
    readonly store = inject(SettingsStore);
    private readonly notify = inject(NotificationService);

    /** El montaje del diálogo lo decide la página; el cierre, el propio diálogo. */
    protected readonly editing = signal(false);

    ngOnInit(): void {
        this.store.load();
    }

    protected onEdit(): void {
        this.editing.set(true);
    }

    protected onCancel(): void {
        this.editing.set(false);
    }

    protected onSaved(entity: SecuritySettings): void {
        this.store.save(entity).subscribe({
            next: () => {
                this.notify.show('success', 'Ajustes de seguridad guardados correctamente.');
                this.editing.set(false);
            },
            error: (error: unknown) => this.notify.handleGenericError(error)
        });
    }
}