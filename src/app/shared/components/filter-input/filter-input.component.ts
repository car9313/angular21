// shared/components/filter-input/filter-input.component.ts
import { Component, input } from '@angular/core';
import { FloatLabel } from 'primeng/floatlabel';
import { InputText } from 'primeng/inputtext';
import { ReactiveFormsModule, FormControl } from '@angular/forms';

@Component({
    selector: 'app-filter-input',
    standalone: true,
    imports: [FloatLabel, InputText, ReactiveFormsModule],
    template: `
        <p-floatlabel variant="on" [class]="containerClass()">
            <input [formControl]="control()" [id]="id()" pInputText [class]="inputClass()" autocomplete="off" />
            <label [for]="id()" [class]="labelClass()">{{ label() }}</label>
        </p-floatlabel>
    `
})
export class FilterInputComponent {
    control = input.required<FormControl<unknown>>(); // FormControl
    label = input.required<string>();
    id = input.required<string>();
    containerClass = input<string>('w-full sm:w-auto min-w-[150px] sm:max-w-[200px]');
    inputClass = input<string>('w-full');
    labelClass = input<string>('text-gray-500');
}
