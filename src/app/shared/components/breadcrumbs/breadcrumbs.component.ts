import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { CommonModule } from '@angular/common';
import { BreadcrumbService } from './breadcrumbs.service';

@Component({
    selector: 'app-breadcrumb',
    standalone: true,
    imports: [CommonModule, BreadcrumbModule],
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
