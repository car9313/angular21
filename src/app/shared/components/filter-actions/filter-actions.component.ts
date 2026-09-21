import { Component, EventEmitter, input, Output } from '@angular/core';
import { Button } from 'primeng/button';
import { Tooltip } from 'primeng/tooltip';

@Component({
    selector: 'app-filter-actions',
    imports: [Button, Tooltip],
    templateUrl: './filter-actions.component.html',
    styleUrl: './filter-actions.component.scss'
})
export class FilterActionsComponent {
    hasFilters = input.required<boolean>();
    hasActiveFilters = input.required<boolean>();
    @Output() apply = new EventEmitter<void>();
    @Output() resetFilters = new EventEmitter<void>();

    onApply = () => {
        this.apply.emit();
    };
    onReset = () => {
        console.log('onReset()2');
        this.resetFilters.emit();
    };
}
