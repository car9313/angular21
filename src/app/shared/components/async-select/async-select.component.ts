/**
 * AsyncSelectComponent
 *
 * Select asincrono que carga opciones via un `loadFn` (Observable).
 * Implementa `ControlValueAccessor` para integrarse con formularios reactivos.
 *
 * Propágación de disabled:
 * - `disabled()` input → para deshabilitado declarativo desde el padre (`[disabled]="true"`)
 * - `formDisabled` signal → para deshabilitado reactivo desde `FormControl.disable()`
 * - `effectiveDisabled()` computed → combina ambos; se usa en el template sobre `p-select[disabled]`
 */
import { ChangeDetectionStrategy, Component, computed, effect, input, OnDestroy, output, signal, Signal, untracked } from '@angular/core';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { Select } from 'primeng/select';
import { Skeleton } from 'primeng/skeleton';
import { InputGroup } from 'primeng/inputgroup';
import { InputGroupAddon } from 'primeng/inputgroupaddon';
import { InputText } from 'primeng/inputtext';

@Component({
    selector: 'app-async-select',
    imports: [FormsModule, Select, Skeleton, InputGroup, InputGroupAddon, InputText],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            multi: true,
            useExisting: AsyncSelectComponent
        }
    ],
    templateUrl: './async-select.component.html',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AsyncSelectComponent implements ControlValueAccessor, OnDestroy {
    loadFn = input.required<() => Observable<any[]>>();
    optionLabel = input('name');
    optionValue = input('id');
    placeholder = input('');
    label = input('');
    inputId = input<string>('');
    showClear = input(true);
    disabled = input(false);
    retryTrigger = input(0);
    filterFn = input<((items: any[]) => any[]) | null>(null);

    permissionDenied = output<boolean>();

    readonly items = signal<any[]>([]);
    readonly displayItems: Signal<any[]> = computed(() => {
        const fn = this.filterFn();
        const all = this.items();
        return fn ? fn(all) : all;
    });
    readonly loading = signal(false);
    readonly denied = signal(false);
    /** Señal interna para el estado disabled propagado desde `FormControl.disable()` */
    private readonly formDisabled = signal(false);
    /** Computed que combina `disabled()` (input) y `formDisabled` (desde CVA) */
    readonly effectiveDisabled = computed(() => this.disabled() || this.formDisabled());

    internalValue: any = null;

    private readonly destroy$ = new Subject<void>();
    private readonly internalTrigger = signal(0);

    private onChange: any = () => {};
    private onTouched: any = () => {};

    constructor() {
        effect(() => {
            this.retryTrigger();
            const trigger = this.internalTrigger();

            if (trigger === 0) {
                untracked(() => this.loadData());
                untracked(() => this.internalTrigger.set(1));
            } else {
                untracked(() => this.loadData());
            }
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    writeValue(obj: any): void {
        this.internalValue = obj;
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    /**
     * ControlValueAccessor.setDisabledState
     * Angular llama a este método cuando el `FormControl` se des/habilita reactivamente.
     * Actualiza `formDisabled` para que el template refleje el estado visual.
     */
    setDisabledState(isDisabled: boolean): void {
        this.formDisabled.set(isDisabled);
    }

    onSelectChange(value: any): void {
        this.internalValue = value;
        this.onChange(value);
    }

    onBlur(): void {
        this.onTouched();
    }

    private loadData(): void {
        this.loading.set(true);
        this.denied.set(false);

        const obs$ = this.loadFn()();

        if (!obs$ || typeof obs$.pipe !== 'function') {
            this.loading.set(false);
            return;
        }

        obs$.pipe(
            takeUntil(this.destroy$),
            finalize(() => this.loading.set(false))
        ).subscribe({
            next: (data: any[]) => {
                this.items.set(data ?? []);
                this.denied.set(false);
            },
            error: (err: any) => {
                this.items.set([]);
                if (err?.status === 403) {
                    this.denied.set(true);
                    this.permissionDenied.emit(true);
                } else {
                    console.error('Error loading catalog:', err);
                }
            }
        });
    }
}
