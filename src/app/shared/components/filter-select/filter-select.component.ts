import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FloatLabel } from 'primeng/floatlabel';
import { Select } from 'primeng/select';
import { ReactiveFormsModule, FormControl } from '@angular/forms';

/**
 * Filtro de lista desplegable con la misma piel que `app-filter-input`
 * (p-floatlabel + control). Pensado para catálogos del backend
 * (p. ej. tipos de auditoría): optionValue lleva el id que viaja
 * como PropertyValue del filtro.
 */
@Component({
    selector: 'app-filter-select',
    standalone: true,
    imports: [FloatLabel, Select, ReactiveFormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <p-floatlabel variant="on" [class]="containerClass()">
            <p-select
                [formControl]="control()"
                [inputId]="id()"
                [options]="options()"
                [optionLabel]="optionLabel()"
                [optionValue]="optionValue()"
                [showClear]="true"
                [placeholder]="placeholder()"
                [style]="{ width: '100%' }"
                styleClass="w-full"
                appendTo="body"
            />
            <label [for]="id()" [class]="labelClass()">{{ label() }}</label>
        </p-floatlabel>
    `
})
export class FilterSelectComponent<T = Record<string, unknown>> {
    control = input.required<FormControl<unknown>>();
    options = input<T[]>([]);
    /** Campo del objeto option a mostrar (default: `name`). */
    optionLabel = input('name');
    /** Campo del objeto option que viaja como valor (default: `id`). */
    optionValue = input('id');
    placeholder = input('');
    label = input.required<string>();
    id = input.required<string>();
    containerClass = input<string>('w-full sm:w-auto min-w-[150px] sm:max-w-[200px]');
    labelClass = input<string>('text-gray-500');
}
