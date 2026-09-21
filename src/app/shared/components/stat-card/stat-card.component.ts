import { Component, input, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-stat-card',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
        <!-- Contenedor Principal -->
        <div class="w-56 rounded-lg overflow-hidden shadow-md cursor-pointer transition-transform hover:scale-105" [style.backgroundColor]="colorClasses().bg">
            <!-- Sección Superior -->
            <div class="p-4 flex justify-between items-start text-white">
                <!-- Icono y Título (Icono opcional) -->
                <div class="flex flex-col gap-2">
                    @if (icon()) {
                        <span class="pi {{ icon() }} text-3xl"></span>
                    }
                    <span class="text-sm font-semibold uppercase tracking-wide">{{ title() }}</span>
                </div>

                <!-- Número -->
                <span class="text-4xl font-bold">{{ count() }}</span>
            </div>

            <!-- Sección Inferior (Enlace) -->
            <a [routerLink]="link() || null" (click)="handleClick($event)" class="bg-white py-3 px-4 flex justify-center items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" [style.color]="colorClasses().text">
                <span class="font-semibold text-sm">{{ linkText() }}</span>
                <i class="pi pi-angle-right font-bold"></i>
            </a>
        </div>
    `
})
export class StatCardComponent {
    title = input.required<string>();
    count = input.required<number>();
    linkText = input<string>('Ver detalles');
    icon = input<string>(''); // Opcional
    color = input<string>('primary'); // primary, danger, warning, info, etc.

    // Nueva entrada para la ruta
    link = input<string>('');

    // Nueva salida para la acción personalizada
    linkClick = output<void>();

    // Mapa de colores usando variables CSS de PrimeNG
    private colorMap: Record<string, any> = {
        primary: { bg: 'var(--p-primary-500)', hoverBg: 'var(--p-primary-50)', text: 'var(--p-primary-500)' },
        danger: { bg: 'var(--p-red-500)', hoverBg: 'var(--p-red-50)', text: 'var(--p-red-500)' },
        warning: { bg: 'var(--p-yellow-500)', hoverBg: 'var(--p-yellow-50)', text: 'var(--p-yellow-500)' },
        info: { bg: 'var(--p-blue-500)', hoverBg: 'var(--p-blue-50)', text: 'var(--p-blue-500)' },
        success: { bg: 'var(--p-green-500)', hoverBg: 'var(--p-green-50)', text: 'var(--p-green-500)' }
    };

    // Computed para obtener las variables CSS correspondientes
    colorClasses = computed(() => {
        return this.colorMap[this.color()] || this.colorMap['primary'];
    });

    // Lógica del clic
    handleClick(event: MouseEvent) {
        // Si hay un link, dejamos que routerLink navegue normalmente
        if (this.link()) {
            return;
        }
        // Si no hay link, prevenimos la navegación y emitimos el evento al padre
        event.preventDefault();
        this.linkClick.emit();
    }
}
