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
import { ChangeDetectionStrategy, Component, computed, effect, input, OnDestroy, output, signal, Signal, untracked, noop } from '@angular/core';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { Select } from 'primeng/select';
import { Skeleton } from 'primeng/skeleton';
import { InputGroup } from 'primeng/inputgroup';
import { InputGroupAddon } from 'primeng/inputgroupaddon';
import { InputText } from 'primeng/inputtext';

/**
 * Shape of the selectable options (keys named by optionLabel / optionValue).
 */
type SelectItem = Record<string, unknown>;

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
loadFn = input.required<() => Observable<SelectItem[]>>();
    optionLabel = input('name');
    optionValue = input('id');
    placeholder = input('');
    label = input('');
    inputId = input<string>('');
    showClear = input(true);
    disabled = input(false);
    retryTrigger = input(0);
    filterFn = input<((items: SelectItem[]) => SelectItem[]) | null>(null);

    permissionDenied = output<boolean>();

    readonly items = signal<SelectItem[]>([]);
    readonly displayItems: Signal<SelectItem[]> = computed(() => {
        const fn = this.filterFn();
        const all = this.items();
        return fn ? fn(all) : all;
    });
    readonly loading = signal(false);
    readonly denied = signal(false);
    /** Señal interna para el estado disabled propagado desde `FormControl.disable()` */
    private readonly formDisabled = signal(false);
    /** Computed que combina `disabled()` (input) y `formDisabled` (desde CVA) */
    readonly effectiveDisabled = computed(() => this.disabled() || this.formDisabled());

    internalValue: unknown = null;

    private readonly destroy$ = new Subject<void>();
    private readonly internalTrigger = signal(0);

    private onChange: (value: unknown) => void = noop;
    private onTouched: () => void = noop;

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

    writeValue(obj: unknown): void {
        this.internalValue = obj;
    }

    registerOnChange(fn: (value: unknown) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
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

    onSelectChange(value: unknown): void {
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
            next: (data: SelectItem[]) => {
                this.items.set(data ?? []);
                this.denied.set(false);
            },
            error: (err: unknown) => {
                this.items.set([]);
                if (err instanceof HttpErrorResponse && err.status === 403) {
                    this.denied.set(true);
                    this.permissionDenied.emit(true);
                } else {
                    console.error('Error loading catalog:', err);
                }
            }
        });
    }
}
