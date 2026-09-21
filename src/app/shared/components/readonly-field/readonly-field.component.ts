import { Component, input } from '@angular/core';

@Component({
    selector: 'app-readonly-field',
    standalone: true,
    template: `
        <dt class="text-sm font-medium text-surface-500 truncate">{{ label() }}</dt>
        <dd class="text-sm text-surface-900"><ng-content /></dd>
    `
})
export class ReadonlyFieldComponent {
    label = input.required<string>();
}
