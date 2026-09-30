import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { Tooltip } from 'primeng/tooltip';
import { SessionStore } from '../../../core/store/session.store';

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
    /** SessionStore is the single permission evaluator (see HasPermissionDirective). */
    private readonly session = inject(SessionStore);

    resource = input.required<string>();
    actions = input.required<string[]>();
    extraButtons = input<ToolbarButton[]>([]);
    config = input<ToolbarConfig>({});

    created = output<void>();
    action = output<{ id: string; payload?: unknown }>();

    private readonly hasNewButtonPermission = computed(() =>
        this.session.hasPermission(this.resource(), this.actions())
    );

    readonly shouldShow = computed(() => {
        const cfg = this.config();
        if (cfg.visible !== undefined) return cfg.visible;
        return this.hasNewButtonPermission() || this.extraButtons().length > 0;
    });

    handleNew() {
        this.created.emit();
    }

    handleAction(btn: ToolbarButton) {
        if (btn.disabled) return;
        this.action.emit({ id: btn.id, payload: btn.payload });
    }
}
