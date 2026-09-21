import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { Tooltip } from 'primeng/tooltip';
import { PermissionService } from '../../../core/services/permission.service';
import { TokenAuthService } from '../../../modules/auth/infrastructure/storage/token-auth.service';

export interface ToolbarButton {
    id: string;
    label?: string;
    icon?: string;
    tooltip?: string;
    rounded?: boolean;
    outlined?: boolean;
    visible?: boolean;
    disabled?: boolean;
    payload?: unknown;
    ariaLabel?: string;
    permission?: {
        resource: string;
        actions: string[];
    };
}

export interface ToolbarConfig {
    visible?: boolean;
    showAddButton?: boolean;
}

@Component({
    selector: 'app-toolbar',
    imports: [HasPermissionDirective, ToolbarModule, ButtonModule, Tooltip],
    standalone: true,
    templateUrl: './toolbar.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToolbarComponent {
    private readonly permissionService = inject(PermissionService);
    private readonly tokenAuthService = inject(TokenAuthService);

    resource = input.required<string>();
    actions = input.required<string[]>();
    extraButtons = input<ToolbarButton[]>([]);
    config = input<ToolbarConfig>({});

    onNew = output<void>();
    onAction = output<{ id: string; payload?: unknown }>();

    private readonly hasNewButtonPermission = computed(() => {
        const roles = this.tokenAuthService.userRoles;
        const { hasAll } = this.permissionService.checkPermissions({
            roles,
            resource: this.resource(),
            actions: this.actions()
        });
        return hasAll;
    });

    readonly shouldShow = computed(() => {
        const cfg = this.config();
        if (cfg.visible !== undefined) return cfg.visible;
        return this.hasNewButtonPermission() || this.extraButtons().length > 0;
    });

    handleNew() {
        this.onNew.emit();
    }

    handleAction(btn: ToolbarButton) {
        if (btn.disabled) return;
        this.onAction.emit({ id: btn.id, payload: btn.payload });
    }
}
