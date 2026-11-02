import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input, output, signal } from '@angular/core';

import { Tooltip } from 'primeng/tooltip';
import { HasPermissionDirective } from '@/app/shared/directives/has-permission.directive';
import { IconButtonComponent, IconButtonSeverity } from '@/app/shared/icon-button/icon-button.component';
import { Button } from 'primeng/button';
import { RESOURCES } from '@/app/core/constants/resources';


export interface ActionToolbarButton {
    id: string;
    label?: string;
    icon?: string;
    tooltip?: string;
    severity?: IconButtonSeverity;
    rounded?: boolean;
    outlined?: boolean;
    visible?: boolean;
    disabled?: boolean;
    loading?: boolean;
    requiresSelection?: boolean;
    ariaLabel?: string;
    permission?: { resource: string; actions: string[] };
    payload?: unknown;
}

@Component({
    selector: 'app-action-toolbar',
    imports: [HasPermissionDirective, NgTemplateOutlet, Tooltip, IconButtonComponent, Button],
    standalone: true,
    templateUrl: './action-toolbar.component.html',
    styleUrl: './action-toolbar.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActionToolbarComponent {
    private readonly destroyRef = inject(DestroyRef);

    buttons = input<ActionToolbarButton[]>([]);
    selected = input<unknown | null>(null);
    selectionLabel = input<string>('');
    selectionName = input<(item: unknown) => string>();

    action = output<{ id: string; payload?: unknown }>();

    private readonly bouncingId = signal<string | null>(null);

    readonly visibleButtons = computed(() => this.buttons().filter((btn) => btn.visible !== false));

    /** Acciones que no dependen de la selección (add, refresh, descargas de listado...). */
    readonly staticButtons = computed(() => this.visibleButtons().filter((btn) => !btn.requiresSelection));

    /** Acciones que operan sobre la fila seleccionada (se pintan tras el chip). */
    readonly selectionButtons = computed(() => this.visibleButtons().filter((btn) => btn.requiresSelection));

    readonly hasSelection = computed(() => this.selected() !== null);

    readonly chipName = computed(() => {
        const item = this.selected();
        if (item === null || item === undefined) return null;
        const format = this.selectionName();
        return format ? format(item) : String(item);
    });

    readonly shouldShow = computed(() => this.visibleButtons().length > 0);

    isBouncing(btn: ActionToolbarButton): boolean {
        return this.bouncingId() === btn.id;
    }

    isDisabled(btn: ActionToolbarButton): boolean {
        if (btn.disabled) return true;
        return !!(btn.requiresSelection && !this.hasSelection());

    }

    handleAction(btn: ActionToolbarButton): void {
        if (this.isDisabled(btn)) return;
        this.bounce(btn);
        this.action.emit({ id: btn.id, payload: btn.payload });
    }

    private bounce(btn: ActionToolbarButton): void {
        this.bouncingId.set(btn.id);
        const timer = setTimeout(() => {
            if (this.bouncingId() === btn.id) this.bouncingId.set(null);
        }, 400);
        this.destroyRef.onDestroy(() => clearTimeout(timer));
    }

    protected readonly RESOURCES = RESOURCES;
}
