import { Component, Output, EventEmitter, input } from '@angular/core';
import { NgStyle } from '@angular/common';
import { ButtonDirective } from 'primeng/button';

@Component({
    selector: 'app-loading-button',
    templateUrl: './loading-button.component.html',
    standalone: true,
    imports: [NgStyle, ButtonDirective],
    styleUrls: ['./loading-button.component.scss']
})
export class LoadingButtonComponent {
    label = input<string>('Guardar');
    loading = input<boolean>(false);
    disabled = input<boolean>(false);
    buttonType = input<'submit' | 'button' | 'reset'>('submit');
    spinnerColor = input<string>('hsl(228, 97%, 42%)');
    textColor = input<string>('');
    customClass = input<string>('w-full p-button-lg p-button-primary');

    @Output() clicked = new EventEmitter<MouseEvent>();

    get buttonClasses(): string {
        return `${this.customClass()} ${this.loading() ? 'opacity-80' : ''}`;
    }

    get buttonStyles(): any {
        const textColor = this.textColor();
        return textColor ? { color: textColor } : {};
    }

    onClick(event: MouseEvent) {
        if (!this.disabled() && !this.loading()) {
            this.clicked.emit(event);
        }
    }
}
