import { ChangeDetectionStrategy, Component, ViewChild, computed, effect, forwardRef, input, signal, noop } from '@angular/core';
import { AbstractControl, ControlValueAccessor, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator } from '@angular/forms';
import { Button } from 'primeng/button';
import { FileSelectEvent, FileUpload } from 'primeng/fileupload';

@Component({
    selector: 'app-file-upload-control',
    standalone: true,
    imports: [FileUpload, Button],
    templateUrl: './file-upload-control.component.html',
    styleUrl: './file-upload-control.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => AppFileUploadControlComponent),
            multi: true
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => AppFileUploadControlComponent),
            multi: true
        }
    ]
})
export class AppFileUploadControlComponent implements ControlValueAccessor, Validator {
    label = input('Documento');
    name = input('requestDocument');
    chooseLabel = input('Seleccionar archivo');
    chooseIcon = input('pi pi-paperclip');
    required = input(true);
    accept = input<string[]>(['.txt', '.docx', '.xlsx', '.pdf']);
    maxSizeMb = input(5);
    maxNameLength = input(100);
    helperText = input<string | null>(null);

    @ViewChild('fileUpload') private fileUpload?: FileUpload;

    readonly selectedFile = signal<File | null>(null);
    readonly currentError = signal<ValidationErrors | null>(null);
    readonly disabled = signal(false);

    readonly acceptAttr = computed(() => this.accept().join(','));
    readonly maxFileSizeBytes = computed(() => this.maxSizeMb() * 1024 * 1024);
    readonly fileName = computed(() => this.selectedFile()?.name ?? '');

    private readonly fileNamePattern = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s_\-().]+$/;

    private onChange: (value: File | null) => void = noop;
    private onTouched: () => void = noop;
    private onValidatorChange: () => void = noop;

    constructor() {
        effect(() => {
            this.required();
            this.accept();
            this.maxSizeMb();
            this.maxNameLength();
            this.onValidatorChange();
        });
    }

    writeValue(value: File | null): void {
        this.selectedFile.set(value ?? null);
        this.currentError.set(value ? this.validateFile(value) : null);

        if (!value) {
            queueMicrotask(() => this.fileUpload?.clear());
        }
    }

    registerOnChange(fn: (value: File | null) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled.set(isDisabled);
    }

    validate(control: AbstractControl<File | null>): ValidationErrors | null {
        void control;
        const file = this.selectedFile();

        if (file) {
            return this.validateFile(file);
        }

        return this.currentError() ?? (this.required() ? { required: true } : null);
    }

    registerOnValidatorChange(fn: () => void): void {
        this.onValidatorChange = fn;
    }

    handleSelect(event: FileSelectEvent): void {
        this.onTouched();

        const file = event.files?.[0] ?? null;

        if (!file) {
            this.clearSelection(this.required() ? { required: true } : null);
            return;
        }

        const validationError = this.validateFile(file);
        if (validationError) {
            this.clearSelection(validationError);
            return;
        }

        this.selectedFile.set(file);
        this.currentError.set(null);
        this.onChange(file);
        this.onValidatorChange();
    }

    removeFile(): void {
        this.onTouched();
        this.clearSelection(this.required() ? { required: true } : null);
        queueMicrotask(() => this.fileUpload?.clear());
    }

    private clearSelection(error: ValidationErrors | null): void {
        this.selectedFile.set(null);
        this.currentError.set(error);
        this.onChange(null);
        this.onValidatorChange();
        queueMicrotask(() => this.fileUpload?.clear());
    }

    private validateFile(file: File): ValidationErrors | null {
        const fileName = file.name.trim();

        const dotIndex = fileName.lastIndexOf('.');
        if (dotIndex < 0) {
            return { invalidFileType: true };
        }

        const extension = fileName.substring(dotIndex).toLowerCase();
        const allowedExtensions = this.accept().map((item) => item.toLowerCase());

        if (!allowedExtensions.includes(extension)) {
            return { invalidFileType: true };
        }

        if (file.size > this.maxFileSizeBytes()) {
            return { invalidFileSize: true };
        }

        if (fileName.length > this.maxNameLength()) {
            return { invalidFileNameLength: true };
        }

        if (!this.fileNamePattern.test(fileName)) {
            return { invalidFileNameChars: true };
        }

        return null;
    }
}
