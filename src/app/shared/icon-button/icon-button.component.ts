// shared/components/icon-button/icon-button.component.ts
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Button } from 'primeng/button';
import { Tooltip } from 'primeng/tooltip';

export type IconButtonSeverity =
    | 'success'
    | 'info'
    | 'warn'        // 👈 PrimeNG usa 'warn', no 'warning'
    | 'danger'
    | 'help'
    | 'secondary'
    | 'contrast'
    | 'primary';    // 👈 también existe

export type IconButtonSize = 'small' | 'large' | undefined;

@Component({
    selector: 'app-icon-button',
    standalone: true,
    imports: [Button, Tooltip],
    changeDetection: ChangeDetectionStrategy.OnPush,
    styles: [
        `
            :host {
                display: inline-flex;
            }
        `
    ],
    template: `
        <p-button
            [label]="label()"
            [icon]="icon()"
            [severity]="severity()"
            [rounded]="rounded()"
            [outlined]="outlined()"
            [size]="size()"
            [loading]="loading()"
            [disabled]="isEffectivelyDisabled()"
            [pTooltip]="tooltip()"
            tooltipPosition="top"
            [styleClass]="extraClass()"
            [attr.aria-label]="ariaLabel() || label() || tooltip() || icon() || null"
            (onClick)="clicked.emit($event)"
            [text]="text()"
        ></p-button>
    `
})
export class IconButtonComponent {
    readonly label = input<string | undefined>(undefined);
    readonly icon = input<string | undefined>(undefined);
    readonly tooltip = input<string>('');
    readonly severity = input<IconButtonSeverity | undefined>(undefined);
    readonly rounded = input(true);
    readonly outlined = input(false);
    readonly size = input<IconButtonSize>(undefined);
    readonly loading = input(false);
    readonly disabled = input(false);
    readonly ariaLabel = input<string | undefined>(undefined);
    readonly text = input(false);

    /** Clases extra al `<button>` interno (ej. 'shadow-md download-btn'). */
    readonly extraClass = input<string>('');

    readonly clicked = output<MouseEvent>();

    /** Regla encapsulada: `loading` implica `disabled`. Un solo lugar. */
    protected isEffectivelyDisabled(): boolean {
        return this.disabled() || this.loading();
    }
}
