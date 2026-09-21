import { Component } from '@angular/core';
import { Skeleton } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
@Component({
    selector: 'app-table-skeleton',
    standalone: true,
    imports: [Skeleton, TableModule],
    templateUrl: './table-skeleton.component.html',
    styleUrl: './table-skeleton.component.scss'
})
export class TableSkeletonComponent {
    products: any[] | undefined;

    ngOnInit() {
        this.products = Array.from({ length: 5 }).map((_, i) => `Item #${i}`);
    }
}
