/*
import { ChangeDetectionStrategy, Component, inject, input, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, of, Observable } from 'rxjs';

import { Fieldset } from 'primeng/fieldset';
import { FloatLabel } from 'primeng/floatlabel';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { PrimeTemplate } from 'primeng/api';
import { FilterService } from '../../core/services/filter.service';
import { FilterableList } from './interfaces/filterable-list';
import {
    ProvinceApiService
} from '../../modules/devolution/nomenclators/provinces/infrastructure/http/province-api.service';
import {
    MunicipalityApiService, PageResponse
} from '../../modules/devolution/nomenclators/municipality/infrastructure/http/municipality-api.service';
import { Municipality } from '../../modules/devolution/nomenclators/municipality/domain/municipality.model';
import { AsyncSelectInfiniteComponent } from '../components/async-select-infinite/async-select-infinite.component';
import { FilterActionsComponent } from '../components/filter-actions/filter-actions.component';


@Component({
    selector: 'app-prueba-person-filter',
    standalone: true,
    imports: [
        Fieldset,
        FilterActionsComponent,
        FloatLabel,
        ReactiveFormsModule,
        InputText,
        Select,
        PrimeTemplate,
        AsyncSelectInfiniteComponent,
    ],
    templateUrl: './person-filter.component.html',
    styleUrls: ['./person-filter.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonFilterComponent implements OnInit, OnDestroy {
    // ─── Inputs ────────────────────────────────────────────────────────────
    readonly dataSource = input.required<FilterableList>();
    // Opcional: permitir ocultar campos que no se necesiten en algunos listados
    readonly hideFirstName = input<boolean>(false);
    readonly hideSecondName = input<boolean>(false);
    readonly hideLastName = input<boolean>(false);
    readonly hideSecondLastName = input<boolean>(false);
    readonly hideStatus = input<boolean>(false);

    // ─── Dependencias ─────────────────────────────────────────────────────
    private fb = inject(FormBuilder);
    private filterService = inject(FilterService);
    private provinceApi = inject(ProvinceApiService);
    private municipalityApi = inject(MunicipalityApiService);
    private destroy$ = new Subject<void>();

    // ─── Formulario ──────────────────────────────────────────────────────
    formFilter!: FormGroup;

    // ─── Estado para municipios ──────────────────────────────────────────
    readonly selectedProvinceCode = signal<string | null>(null);
    readonly municipalityReloadTrigger = signal(0);

    // ─── Opciones para el select de sexo ────────────────────────────────
    readonly sexOptions = [
        { label: 'Masculino', value: true },
        { label: 'Femenino', value: false },
    ];

    // ─── Métodos para cargar provincias y municipios ──────────────────
    protected loadProvinces = this.provinceApi.getProvincesForSelect.bind(this.provinceApi);

    protected loadMunicipalities = (
        cursor?: string,
        filter?: string
    ): Observable<PageResponse<Municipality>> => {
        const provinceCode = this.selectedProvinceCode();
        if (!provinceCode) {
            return of({ objects: [], nextCursor: null });
        }
        return this.municipalityApi.getMunicipalitiesByProvince(provinceCode, cursor, filter);
    };

    // ─── Lifecycle ──────────────────────────────────────────────────────
    ngOnInit(): void {
        this.initForm();
        this.syncFormWithStore();
        this.setMunicipalityEnabledState();
        this.watchProvinceChanges();
    }

    private initForm(): void {
        this.formFilter = this.fb.group({
            IdentityNumber: [''],
            Gender: [null],
            ProvinceId: [null],
            MunicipalityId: [null],
            Status: [null],
            FirstName: [''],
            SecondName: [''],
            LastName: [''],
            SecondLastName: [''],
        });
    }

    private syncFormWithStore(): void {
        this.filterService.syncFormWithStore(
            this.formFilter,
            () => this.dataSource().query()
        );
    }

    private setMunicipalityEnabledState(): void {
        const provinceCode = this.formFilter.controls['ProvinceId'].value;
        if (provinceCode) {
            this.formFilter.controls['MunicipalityId'].enable({ emitEvent: false });
        } else {
            this.formFilter.controls['MunicipalityId'].disable({ emitEvent: false });
        }
    }

    private watchProvinceChanges(): void {
        this.formFilter.controls['ProvinceId'].valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe((code) => {
                this.selectedProvinceCode.set(code);
                this.municipalityReloadTrigger.update((v) => v + 1);
                this.formFilter.controls['MunicipalityId'].reset(null, { emitEvent: false });
                this.setMunicipalityEnabledState();
            });
    }

    // ─── Métodos públicos para el template ──────────────────────────────
    hasActiveFilters(): boolean {
        return this.filterService.hasActiveFilters(this.dataSource().query().filter);
    }

    hasFilters(): boolean {
        return this.filterService.hasFilters(this.formFilter.value);
    }

    onSubmit(): void {
        this.filterService.onSubmit(
            this.formFilter,
            (params) => this.dataSource().setFilters(params)
        );
    }

    onReset(): void {
        this.filterService.onReset(
            this.formFilter,
            () => this.dataSource().clearQueryParams()
        );
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
*/
