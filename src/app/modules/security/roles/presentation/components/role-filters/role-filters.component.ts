// features/roles/presentation/role-filters.component.ts
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RoleListStore } from '@/app/modules/security/roles/presentation/stores/role-list.store';


@Component({
    selector: 'app-role-filters',
    standalone: true,
    imports: [ReactiveFormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <input formControlName="Name" placeholder="Nombre" />
            <input formControlName="IsUnEditable" type="checkbox" />

            <button type="submit">Aplicar</button>
            <button type="button" (click)="onReset()">Limpiar</button>
        </form>
    `
})
export class RoleFiltersComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly store = inject(RoleListStore);

    readonly form = this.fb.group({
        Name: [''],
        IsUnEditable: [false]
    });

    ngOnInit(): void {
        // Sincroniza el form con los filtros que ya están en el store
        // (útil si vienen de la URL al montar la pantalla)
        this.form.patchValue(this.store.filtersAsObject(), { emitEvent: false });
    }

    onSubmit(): void {
        this.store.applyFiltersAndReload(this.form.value as Record<string, unknown>);
    }

    onReset(): void {
        this.form.reset();
        this.store.clearFiltersAndReload();
    }
}
