import { Component, EventEmitter, TemplateRef, ViewChild, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { ButtonDirective } from 'primeng/button';
import { NgTemplateOutlet } from '@angular/common';
import { Filter, QueryParams } from '../../../core/interfaces/query-params';
import { Tooltip } from 'primeng/tooltip';
import { FloatLabel } from 'primeng/floatlabel';

@Component({
    selector: 'app-search-bar',
    standalone: true,
    templateUrl: './search-bar.component.html',
    imports: [FormsModule, InputText, ButtonDirective, NgTemplateOutlet, Tooltip, FloatLabel]
})
export class SearchBarComponent {
    @Input() searchText = '';
    @Output() searchTextChange = new EventEmitter<string>();

    @Input() strict = false;
    @Output() strictChange = new EventEmitter<boolean>();

    @Input() specificFilters: TemplateRef<unknown> | null = null;

    @Output() searchParams = new EventEmitter<Omit<QueryParams, 'pag'>>();

    @Output() resetFilters = new EventEmitter<void>();

    @ViewChild('defaultStrictTemplate', { static: true }) defaultStrictTemplate!: TemplateRef<unknown>;

    private readonly fb = inject(FormBuilder);

    form: FormGroup;

    constructor() {
        this.form = this.fb.group({});
    }

    get hasActiveFilters(): boolean {
        const hasText = this.searchText?.trim().length > 0;
        const hasFilters = this.buildFilters(this.form.value).length > 0;
        return hasText || hasFilters;
    }
    onSubmit() {
        const filters: Filter[] = this.buildFilters(this.form.value); // transforma filtros específicos
        const params: Omit<QueryParams, 'pag'> = {
            search: {
                SearchText: this.searchText,
                Strict: this.strict
            },
            filter: filters,
            sort: [] // opcional, si no hay orden actual
        };
        this.searchParams.emit(params);
    }
    onReset() {
        this.searchText = '';
        this.strict = false;
        this.searchTextChange.emit(this.searchText);
        this.strictChange.emit(this.strict);
        this.form.reset();
        this.resetFilters.emit();
    }
    private buildFilters(formValues: Record<string, unknown>): Filter[] {
        return Object.entries(formValues)
            .filter(([, value]) => value !== null && value !== undefined && value !== '')
            .map(([key, value]) => ({
                PropertyName: key,
                PropertyValue: String(value)
            }));
    }
}