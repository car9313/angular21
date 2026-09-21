import { Component, computed, input } from '@angular/core';

@Component({
    selector: 'app-empty-state',
    standalone: true,
    template: `
        <div class="flex flex-col items-center justify-center py-8 gap-2">
            <i [class]="iconClass()"></i>
            <h3 class="text-lg font-semibold text-gray-600 dark:text-gray-400">{{ title() }}</h3>
            @if (description()) {
                <p class="text-sm text-gray-400">{{ description() }}</p>
            }
            <ng-content />
        </div>
    `
})
export class EmptyStateComponent {
    icon = input('pi pi-inbox');
    title = input.required<string>();
    description = input<string>('');
    type = input<'empty' | 'error'>('empty');

    iconClass = computed(() => {
        const size = 'text-4xl';
        const color = this.type() === 'error' ? 'text-red-400' : 'text-gray-400';
        return `${this.icon()} ${size} ${color}`;
    });
}
