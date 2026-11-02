import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Fieldset } from 'primeng/fieldset';
import { AuditListStore } from '@/app/modules/security/audits/presentation/stores/audit-list.store';
import { AuditRepository } from '@/app/modules/security/audits/infrastructure/http/audit-repository';
import { ActionType } from '@/app/modules/security/audits/domain/action-type';
import { NotificationService } from '@/app/core/services/notification-services';
import { parseISOToDate } from '@/app/core/helpers/date-mapper.helper';
import { FilterInputComponent } from '@/app/shared/components/filter-input/filter-input.component';
import { FilterSelectComponent } from '@/app/shared/components/filter-select/filter-select.component';
import { FilterDatepickerComponent } from '@/app/shared/components/filter-datepicker/filter-datepicker.component';
import { FilterActionsComponent } from '@/app/shared/components/filter-actions/filter-actions.component';

/**
 * Panel de filtros de auditorías (contrato del backend:
 * UserName/UserFullName/UserHostAddress/Action/InitDate/EndDate).
 *
 * El store es el dueño de `query` (con persistencia `audit.list.filters`);
 * el form vive SOLO en este componente y se sincroniza desde el store al
 * montar (incluye fechas 'YYYY-MM-DD' → Date y Action → number para que el
 * select muestre la selección restaurada).
 */
@Component({
    selector: 'app-audit-filters',
    standalone: true,
    imports: [ReactiveFormsModule, Fieldset, FilterInputComponent, FilterSelectComponent, FilterDatepickerComponent, FilterActionsComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <p-fieldset legend="Filtros" [toggleable]="true">
            <form [formGroup]="form" (ngSubmit)="onSubmit()" autocomplete="off" class="flex flex-col sm:flex-row flex-wrap sm:justify-end items-end gap-4">
                <app-filter-input [control]="form.controls.UserName" label="Usuario" id="auditUserName" />
                <app-filter-input [control]="form.controls.UserFullName" label="Nombre completo" id="auditUserFullName" />
                <app-filter-input [control]="form.controls.UserHostAddress" label="Dirección IP" id="auditUserHostAddress" />
                <app-filter-select [control]="form.controls.Action" [options]="actionOptions()" label="Acción" id="auditAction" />
                <app-filter-datepicker [control]="form.controls.InitDate" label="Fecha desde" id="auditInitDate" />
                <app-filter-datepicker [control]="form.controls.EndDate" label="Fecha hasta" id="auditEndDate" />
                <!-- (apply) no se enlaza: el botón Aplicar es type=submit y el
                     form ya dispara onSubmit vía (ngSubmit) — enlazar ambos
                     duplicaría la recarga. -->
                <app-filter-actions [hasFilters]="hasFormFilters()" [hasActiveFilters]="store.hasActiveFilters()" (resetFilters)="onReset()" />
            </form>
        </p-fieldset>
    `
})
export class AuditFiltersComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly destroyRef = inject(DestroyRef);
    private readonly repository = inject(AuditRepository);
    private readonly notify = inject(NotificationService);

    readonly store = inject(AuditListStore);

    /** Catálogo de tipos de acción (fetch manual al montar, como el catálogo de roles en user-dialog). */
    readonly actionOptions = signal<ActionType[]>([]);

    /** ¿El form tiene algún valor? Habilita el botón Aplicar. */
    readonly hasFormFilters = signal(false);

    readonly form = this.fb.group({
        UserName: [''],
        UserFullName: [''],
        UserHostAddress: [''],
        Action: [null as number | null],
        InitDate: [null as Date | null],
        EndDate: [null as Date | null]
    });

    constructor() {
        this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
            this.hasFormFilters.set(this.formFilled());
        });
    }

    ngOnInit(): void {
        this.syncFromStore();
        this.loadActionTypes();
    }

    onSubmit(): void {
        // buildFilters (dentro de applyFilters) ignora vacíos y serializa
        // Date → 'YYYY-MM-DD'; Page vuelve a 1 solo con aplicar.
        this.store.applyFiltersAndReload(this.form.getRawValue() as Record<string, unknown>);
    }

    onReset(): void {
        // Valores explícitos: reset() sin argumentos dejaría null (no '')
        // en los campos de texto, rompiendo el contrato del form.
        this.form.reset({ UserName: '', UserFullName: '', UserHostAddress: '', Action: null, InitDate: null, EndDate: null });
        this.store.clearFiltersAndReload();
    }

    /** Hidrata el form con lo que el store restauró (persistencia 24 h). */
    private syncFromStore(): void {
        const stored = this.store.filtersAsObject();

        this.form.patchValue(
            {
                UserName: stored['UserName'] ?? '',
                UserFullName: stored['UserFullName'] ?? '',
                UserHostAddress: stored['UserHostAddress'] ?? '',
                Action: stored['Action'] != null ? Number(stored['Action']) : null,
                InitDate: parseISOToDate(stored['InitDate'] ?? null),
                EndDate: parseISOToDate(stored['EndDate'] ?? null)
            },
            { emitEvent: false }
        );
        this.hasFormFilters.set(this.formFilled());
    }

    /** Mismo criterio que buildFilters: null/undefined/'' no cuentan. */
    private formFilled(): boolean {
        return Object.values(this.form.getRawValue()).some((value) => value != null && value !== '');
    }

    private loadActionTypes(): void {
        this.repository.getActionTypes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (types) => this.actionOptions.set([...types].sort((a, b) => a.id - b.id)),
            error: (error: unknown) => this.notify.handleGenericError(error)
        });
    }
}
