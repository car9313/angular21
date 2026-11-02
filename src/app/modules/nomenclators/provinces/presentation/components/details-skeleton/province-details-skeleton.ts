import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'app-country-details-skeleton',
    standalone: true,
    templateUrl: './province-details-skeleton.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CountryDetailsSkeletonComponent {}
