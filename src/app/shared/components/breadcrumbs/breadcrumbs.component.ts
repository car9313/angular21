import { Component, ChangeDetectionStrategy, computed, inject, ViewEncapsulation } from '@angular/core';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { CommonModule } from '@angular/common';
import { BreadcrumbService } from './breadcrumbs.service';

@Component({
    selector: 'app-breadcrumb',
    standalone: true,
    imports: [CommonModule, BreadcrumbModule],
    styleUrl: './breadcrumbs.component.css',
    // None: the styles target PrimeNG's internal <nav>/<li>/<a>, which the
    // default emulated encapsulation cannot reach (see breadcrumbs.component.css).
    encapsulation: ViewEncapsulation.None,
    template: ` <p-breadcrumb styleClass="custom-breadcrumb" [model]="items()"></p-breadcrumb> `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BreadcrumbComponent {
    private readonly breadcrumbService = inject(BreadcrumbService);

    items = computed(() =>
        this.breadcrumbService.breadcrumbs().map((c) => ({
            label: c.label,
            routerLink: c.url ? [c.url] : undefined,
            disabled: !c.url,
            styleClass: c.url ? 'bc-link' : 'bc-text'
        }))
    );
}
