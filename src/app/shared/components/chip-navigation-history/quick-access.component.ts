import { Component, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChipModule } from 'primeng/chip';
import { Router, RouterLink } from '@angular/router';
import { QuickAccessService } from './quick-access.service';

@Component({
    selector: 'app-chip-breadcrumb',
    standalone: true,
    imports: [CommonModule, ChipModule, RouterLink],
    styleUrl: './quick-access.component.css',
    template: `
        <div class="chip-breadcrumbs">
            <p-chip
                *ngFor="let crumb of items(); let i = index"
                [label]="crumb.label"
                [routerLink]="crumb.isCurrent ? null : crumb.routerLink"
                clickable="true"
                removable="true"
                (onRemove)="removeCrumb(i)"
                [styleClass]="'custom-chip mr-2 mb-2' + (crumb.isCurrent ? ' active-chip' : '')"
            ></p-chip>
        </div>
    `,
    styles: [
        `
            .mr-2 {
                margin-right: 0.5rem;
            }
            .mb-2 {
                margin-bottom: 0.5rem;
            }
        `
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuickAccessComponent {
    items = computed(() =>
        this.breadcrumbService.chipNavigations().map((crumb) => ({
            ...crumb,
            isCurrent: crumb.url === this.breadcrumbService.currentUrl()
        }))
    );

    constructor(
        private breadcrumbService: QuickAccessService,
        private router: Router
    ) {}

    /**
     * Elimina el crumb en la posición i y navega
     * al crumb previo (si quieres navegar), o simplemente
     * lo elimina del historial.
     */
    removeCrumb(index: number) {
        const current = this.breadcrumbService.chipNavigations();
        // 1) Opcional: navega al crumb anterior
        const prev = current[index - 1];
        if (prev) {
            this.router.navigateByUrl(prev.url).catch(() => undefined);
        }
        // 2) Elimina del historial
        this.breadcrumbService.removeAt(index);
    }
}
