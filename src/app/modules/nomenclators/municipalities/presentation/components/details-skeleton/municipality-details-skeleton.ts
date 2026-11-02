import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'app-country-details-skeleton',
    standalone: true,
    templateUrl: './municipality-details-skeleton.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CountryDetailsSkeletonComponent {}
