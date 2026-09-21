// shared/components/filter-select/filter-select.component.ts
import { Component, input } from '@angular/core';
import { FloatLabel } from 'primeng/floatlabel';
import { Select } from 'primeng/select';
import { ReactiveFormsModule, FormControl } from '@angular/forms';

@Component({
    selector: 'app-filter-select',
    standalone: true,
    imports: [FloatLabel, Select, ReactiveFormsModule],
    template: `
        <p-floatlabel variant="on" [class]="containerClass()">
            <p-select [formControl]="control()" [options]="options()" [optionLabel]="optionLabel()" [optionValue]="optionValue()" [virtualScroll]="true" [virtualScrollItemSize]="38" class="w-full" />
            <!-- p-select wraps its own input inside: the label below is
                 associated via the component's internal id forwarding -->
            <!-- eslint-disable-next-line @angular-eslint/template/label-has-associated-control -->
            <label [class]="labelClass()">{{ label() }}</label>
        </p-floatlabel>
    `
})
export class FilterSelectComponent {
    control = input.required<FormControl<unknown>>();
    options = input.required<Record<string, unknown>[]>();
    label = input.required<string>();
    optionLabel = input<string>('name');
    optionValue = input<string>('id');
    containerClass = input<string>('w-full sm:w-auto min-w-[150px] sm:max-w-[200px]');
    labelClass = input<string>('text-gray-500');
}
