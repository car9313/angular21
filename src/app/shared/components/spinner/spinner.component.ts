import { Component } from '@angular/core';
import { LoadingService } from '../../../core/services/loading.service';
import { ProgressSpinner } from 'primeng/progressspinner';
import { AsyncPipe, NgIf } from '@angular/common';

@Component({
    selector: 'app-spinner',
    imports: [ProgressSpinner, NgIf, AsyncPipe],
    templateUrl: './spinner.component.html',
    styleUrl: './spinner.component.scss'
})
export class SpinnerComponent {
    loading$;

    constructor(private loadingService: LoadingService) {
        this.loading$ = this.loadingService.loading$;
    }
}
