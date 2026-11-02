import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FloatLabel } from 'primeng/floatlabel';
import { DatePicker } from 'primeng/datepicker';
import { ReactiveFormsModule, FormControl } from '@angular/forms';

/**
 * Filtro de fecha con la misma piel que `app-filter-input`.
 * El control recibe/entrega un `Date` (o null); `buildFilters` lo
 * serializa a 'YYYY-MM-DD' para el contrato .NET.
 */
@Component({
    selector: 'app-filter-datepicker',
    standalone: true,
    imports: [FloatLabel, DatePicker, ReactiveFormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <p-floatlabel variant="on" [class]="containerClass()">
            <p-datepicker
                [formControl]="control()"
                [inputId]="id()"
                [showIcon]="true"
                dateFormat="dd/mm/yy"
                [placeholder]="placeholder()"
                [showOnFocus]="false"
                [style]="{ width: '100%' }"
                styleClass="w-full"
                appendTo="body"
            />
            <label [for]="id()" [class]="labelClass()">{{ label() }}</label>
        </p-floatlabel>
    `
})
export class FilterDatepickerComponent {
    control = input.required<FormControl<unknown>>();
    placeholder = input('');
    label = input.required<string>();
    id = input.required<string>();
    containerClass = input<string>('w-full sm:w-auto min-w-[150px] sm:max-w-[200px]');
    labelClass = input<string>('text-gray-500');
}
