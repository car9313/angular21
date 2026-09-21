import { Component, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { ButtonDirective } from 'primeng/button';
import { NgIf, NgTemplateOutlet } from '@angular/common';
import { Filter, QueryParams } from '../../../core/interfaces/query-params';
import { Tooltip } from 'primeng/tooltip';
import { FloatLabel } from 'primeng/floatlabel';

@Component({
    selector: 'app-search-bar',
    standalone: true,
    templateUrl: './search-bar.component.html',
    imports: [FormsModule, InputText, ButtonDirective, NgTemplateOutlet, Tooltip, FloatLabel, NgIf]
})
export class SearchBarComponent implements OnInit {
    @Input() searchText: string = '';
    @Output() searchTextChange = new EventEmitter<string>();

    @Input() strict: boolean = false;
    @Output() strictChange = new EventEmitter<boolean>();

    @Input() specificFilters: TemplateRef<any> | null = null;

    @Output() onSearch = new EventEmitter<Omit<QueryParams, 'pag'>>();

    @Output() onResetFilters = new EventEmitter<void>();

    @ViewChild('defaultStrictTemplate', { static: true }) defaultStrictTemplate!: TemplateRef<any>;

    form: FormGroup;

    constructor(private fb: FormBuilder) {
        this.form = this.fb.group({});
    }

    ngOnInit() {}

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
        this.onSearch.emit(params);
    }
    onReset() {
        this.searchText = '';
        this.strict = false;
        this.searchTextChange.emit(this.searchText);
        this.strictChange.emit(this.strict);
        this.form.reset();
        this.onResetFilters.emit();
    }
    private buildFilters(formValues: Record<string, any>): Filter[] {
        return Object.entries(formValues)
            .filter(([_, value]) => value !== null && value !== undefined && value !== '')
            .map(([key, value]) => ({
                PropertyName: key,
                PropertyValue: String(value)
            }));
    }
}
