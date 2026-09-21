// shared/components/filter-datepicker/filter-datepicker.component.ts
import { Component, input } from '@angular/core';
import { FloatLabel } from 'primeng/floatlabel';
import { DatePicker } from 'primeng/datepicker';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
    selector: 'app-filter-datepicker',
    standalone: true,
    imports: [FloatLabel, DatePicker, ReactiveFormsModule],
    template: `
        <p-floatlabel variant="on" [class]="containerClass()">
            <p-date-picker [formControl]="control()" [id]="id()" dateFormat="dd/mm/yy" [iconDisplay]="'input'" [showIcon]="true" [showButtonBar]="true" class="w-full" styleClass="w-full" [style]="{ width: '100%' }" />
            <label [for]="id()" [class]="labelClass()">{{ label() }}</label>
        </p-floatlabel>
    `
})
export class FilterDatepickerComponent {
    control = input.required<any>();
    label = input.required<string>();
    id = input.required<string>();
    containerClass = input<string>('w-full sm:w-auto min-w-[150px] sm:max-w-[200px]');
    labelClass = input<string>('dark:text-gray-300 text-gray-600');
}
