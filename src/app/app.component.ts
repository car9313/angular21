import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SpinnerComponent } from './shared/components/spinner/spinner.component';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterModule, SpinnerComponent],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `<router-outlet></router-outlet>
<app-spinner />`
})
export class AppComponent {}