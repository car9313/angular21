import { Component, inject } from '@angular/core';
import { ProgressSpinner } from 'primeng/progressspinner';
import { LoadingService } from '../../../core/services/loading.service';

/**
 * App-level full-screen spinner for route transitions and page refreshes.
 *
 * Rendered once (AppComponent) and driven by `LoadingService`, which turns on
 * after a minimum navigation duration and off on every terminal router event.
 * Signals keep it working under zoneless change detection with no AsyncPipe.
 */
@Component({
    selector: 'app-spinner',
    imports: [ProgressSpinner],
    templateUrl: './spinner.component.html',
    styleUrl: './spinner.component.scss'
})
export class SpinnerComponent {
    private readonly loadingService = inject(LoadingService);

    readonly loading = this.loadingService.loading;
}
