import { ChangeDetectionStrategy, Component, OnInit, signal, output, input, OnChanges } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { Button } from 'primeng/button';
import { Tooltip } from 'primeng/tooltip';
import { FloatLabel } from 'primeng/floatlabel';

@Component({
    selector: 'app-search',
    imports: [ReactiveFormsModule, InputText, Tooltip, Button, FloatLabel, FormsModule],
    templateUrl: './search.component.html',
    styleUrl: './search.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchComponent implements OnChanges {
    /** valor controlado externamente */
    searchText = input<string>('');
    /** emite al presionar buscar */
    search = output<string>();

    text = signal<string>(this.searchText()); // estado interno local

    ngOnChanges() {
        // sincroniza el valor externo con el input si cambia desde el padre
        this.text.set(this.searchText());
    }
    handleSearch() {
        this.search.emit(this.text());
    }

    hasActiveSearch(): boolean {
        return !!(this.searchText() && this.searchText().trim().length > 0);
    }

    hasSearchText(): boolean {
        return !!(this.text() && this.text().trim().length > 0);
    }

    clear() {
        this.text.set('');
        this.search.emit('');
    }
}
