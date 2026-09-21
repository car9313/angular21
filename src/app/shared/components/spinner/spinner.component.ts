import { Component, inject } from '@angular/core';
import { LoadingService } from '../../../core/services/loading.service';
import { ProgressSpinner } from 'primeng/progressspinner';
import { AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-spinner',
    imports: [ProgressSpinner, AsyncPipe],
    templateUrl: './spinner.component.html',
    styleUrl: './spinner.component.scss'
})
export class SpinnerComponent {
    private readonly loadingService = inject(LoadingService);

    readonly loading$: Observable<boolean> = this.loadingService.loading$;
}