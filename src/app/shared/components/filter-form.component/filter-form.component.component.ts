import { Component, EventEmitter, Input, Output, Signal } from '@angular/core';
import { Button } from 'primeng/button';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Tooltip } from 'primeng/tooltip';

@Component({
    selector: 'app-filter-form',
    imports: [ReactiveFormsModule, Button, Tooltip, FormsModule],
    templateUrl: './filter-form.component.component.html',
    styleUrl: './filter-form.component.component.scss'
})
export class FilterFormComponentComponent {
    /** Formulario reactivo */
    @Input({ required: true }) form!: FormGroup;

    /** Signals reactivas para el estado */
    @Input({ required: true }) hasFilters!: Signal<boolean>;
    @Input({ required: true }) hasActiveFilters!: Signal<boolean>;

    /** Eventos para acciones del formulario */
    @Output() apply = new EventEmitter<void>();
    @Output() resetFilters = new EventEmitter<void>();

    onApply() {
        this.apply.emit();
    }

    onReset() {
        this.reset.emit();
    }
}
