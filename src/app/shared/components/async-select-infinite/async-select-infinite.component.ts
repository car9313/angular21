import { ChangeDetectionStrategy, Component, computed, effect, input, OnDestroy, output, signal, untracked, inject, DestroyRef, OnInit, noop } from '@angular/core';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { merge, Observable, Subject, of, switchMap, catchError, mapTo, debounceTime, distinctUntilChanged, takeUntil, tap, finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Select } from 'primeng/select';
import { Skeleton } from 'primeng/skeleton';
import { InputGroup } from 'primeng/inputgroup';
import { InputGroupAddon } from 'primeng/inputgroupaddon';
import { InputText } from 'primeng/inputtext';
import { FloatLabel } from 'primeng/floatlabel';
import { Button } from 'primeng/button';
import { Tooltip } from 'primeng/tooltip';
import { CommonModule } from '@angular/common';

export interface PageResponse<T> {
    objects: T[];
    nextCursor: string | null;
}

/**
 * Shape of the selectable options: objects with the keys named by the
 * optionLabel / optionValue inputs. Typed as a record so the component stays
 * item-agnostic while keeping dot-free dynamic access safe.
 */
type SelectItem = Record<string, unknown>;

@Component({
    selector: 'app-async-select-infinite',
    standalone: true,
    imports: [CommonModule, FormsModule, Select, Skeleton, InputGroup, InputGroupAddon, InputText, FloatLabel, Button, Tooltip],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            multi: true,
            useExisting: AsyncSelectInfiniteComponent
        }
    ],
    templateUrl: './async-select-infinite.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AsyncSelectInfiniteComponent implements ControlValueAccessor, OnDestroy, OnInit {
    // ---- Inputs ----
    loadPageFn = input.required<(cursor?: string, searchTerm?: string) => Observable<PageResponse<SelectItem>>>();
    optionLabel = input('name');
    optionValue = input('id');
    placeholder = input('');
    label = input('');
    inputId = input<string>('');
    showClear = input(true);
    disabled = input(false);
    filterFn = input<((items: SelectItem[]) => SelectItem[]) | null>(null);

    containerClass = input<string>('');
    panelMaxHeight = input<string>('250px');
    loadMoreText = input<string>('Cargar más');
    loadingMoreText = input<string>('Cargando...');
    noMoreText = input<string>('No hay más elementos');
    emptyMessage = input<string>('No hay elementos disponibles');
    errorMessage = input<string>('Error al cargar los datos. Intente nuevamente.');
    searchPlaceholder = input('Buscar...');
    searchButtonLabel = input('Buscar');

    enableSearch = input(true);
    cacheKey = input<string>('');
    debounceTimeMs = input(200);
    findItemByValue = input<(value: unknown) => Observable<SelectItem | null>>(() => of(null));

    permissionDenied = output<boolean>();

    // ---- Estado ----
    readonly items = signal<SelectItem[]>([]);
    readonly findingItem = signal(false);
    readonly cursor = signal<string | null>(null);
    readonly hasMore = signal<boolean>(true);
    readonly loading = signal(false);
    readonly initialLoading = signal(true);
    readonly loadingMore = signal(false);
    readonly denied = signal(false);
    readonly error = signal(false);
    readonly errorDetail = signal<unknown>(null);
    readonly searchTerm = signal('');

    // Variable local para el input de búsqueda (para el botón manual)
    searchTermInput = '';

    private readonly formDisabled = signal(false);
    readonly effectiveDisabled = computed(() => this.disabled() || this.formDisabled());

    readonly hasSearch = computed(() => this.searchTerm().length > 0);

    readonly displayItems = computed(() => {
        const fn = this.filterFn();
        const all = this.items();
        return fn ? fn(all) : all;
    });

    // ---- CVA ----
    internalValue: unknown = null;
    private onChange: (value: unknown) => void = noop;
    private onTouched: () => void = noop;

    // ---- Destroy ----
    private destroyRef = inject(DestroyRef);
    private cancelLoadMore$ = new Subject<void>();

    // ---- Búsqueda manual ----
    private searchSubject = new Subject<string>();
    private initialLoad$ = new Subject<void>();
    private _internalReloadTrigger = signal(0);
    reloadTrigger = input<number>(0);

    constructor() {
        effect(() => {
            this.reloadTrigger();
            this._internalReloadTrigger();
            untracked(() => {
                this.initialLoad$.next();
            });
        });
    }

    ngOnInit(): void {
        merge(this.initialLoad$.pipe(mapTo('')), this.searchSubject.pipe(debounceTime(this.debounceTimeMs()), distinctUntilChanged()))
            .pipe(
                tap((term) => {
                    this.cancelLoadMore$.next();
                    this.denied.set(false);
                    this.error.set(false);
                    this.loadingMore.set(false);
                    this.searchTerm.set(term);

                    if (this.initialLoading()) {
                        this.items.set([]);
                        this.cursor.set(null);
                        this.hasMore.set(true);
                    }

                    this.loading.set(true);
                }),
                switchMap((term) => {
                    return this.loadPageFn()(undefined, term).pipe(
                        catchError((err) => {
                            this.error.set(true);
                            this.errorDetail.set(err);
                            if (err?.status === 403) {
                                this.denied.set(true);
                                this.permissionDenied.emit(true);
                            }
                            return of({ objects: [], nextCursor: null });
                        })
                    );
                }),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe((res) => {
                this.items.set(res.objects);
                this.cursor.set(res.nextCursor);
                this.hasMore.set(res.nextCursor !== null);
                this.loading.set(false);
                this.initialLoading.set(false);
                this.ensureSelectedItemExists();
            });
    }

    private ensureSelectedItemExists(): void {
        if (this.internalValue == null) return;
        const key = this.optionValue();
        if (this.items().some((i) => i[key] === this.internalValue)) return;

        const fn = this.findItemByValue();
        if (!fn) return;

        this.findingItem.set(true);
        fn(this.internalValue)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((item) => {
                if (item) {
                    this.items.update((items) => [item, ...items]);
                }
                this.findingItem.set(false);
            });
    }

    ngOnDestroy(): void {
        this.cancelLoadMore$.next();
        this.cancelLoadMore$.complete();
    }

    // ---- CVA methods ----
    writeValue(obj: unknown): void {
        this.internalValue = obj;
    }
    registerOnChange(fn: (value: unknown) => void): void {
        this.onChange = fn;
    }
    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }
    setDisabledState(isDisabled: boolean): void {
        this.formDisabled.set(isDisabled);
    }

    // ---- Eventos del select ----
    onSelectChange(value: unknown): void {
        this.internalValue = value;
        this.onChange(value);
    }
    onBlur(): void {
        this.onTouched();
    }

    // ---- Búsqueda manual ----
    performSearch(event?: Event): void {
        if (event) {
            event.stopPropagation();
        }
        if (this.searchTermInput.trim().length > 0) {
            this.searchSubject.next(this.searchTermInput.trim());
        } else {
            this.searchSubject.next('');
        }
    }

    // Al presionar Enter en el input
    onSearchKeydown(event: KeyboardEvent): void {
        if (event.key === 'Enter') {
            event.preventDefault();
            event.stopPropagation();
            this.performSearch(event);
        }
    }

    clearSearch(event?: Event): void {
        if (event) {
            event.stopPropagation();
        }
        this.searchTermInput = '';
        this.searchSubject.next('');
    }

    // ---- Carga de más ----
    loadNextPage(): void {
        if (this.loadingMore() || !this.hasMore() || !this.cursor()) {
            return;
        }

        const currentCursor = this.cursor();
        const currentTerm = this.searchTerm();

        this.loadingMore.set(true);
        this.error.set(false);

        this.loadPageFn()(currentCursor!, currentTerm)
            .pipe(
                takeUntil(this.cancelLoadMore$),
                takeUntilDestroyed(this.destroyRef),
                finalize(() => {
                    this.loadingMore.set(false);
                })
            )
            .subscribe({
                next: (res: PageResponse<SelectItem>) => {
                    this.items.update((prev) => [...prev, ...res.objects]);
                    this.cursor.set(res.nextCursor);
                    this.hasMore.set(res.nextCursor !== null);
                },
                error: (err: unknown) => {
                    this.error.set(true);
                    this.errorDetail.set(err);
                    this.loadingMore.set(false);
                }
            });
    }

    retry(): void {
        this.error.set(false);
        if (this.items().length === 0) {
            this.initialLoading.set(true);
            this.initialLoad$.next();
        } else {
            this.loadNextPage();
        }
    }
}
