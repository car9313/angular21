import { Component, OnInit, inject } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { Location, NgOptimizedImage } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';

@Component({
    selector: 'app-access',
    standalone: true,
    imports: [ButtonModule, RouterModule, RippleModule, AppFloatingConfigurator, NgOptimizedImage],
    template: ` <app-floating-configurator />
        <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
            <div class="flex flex-col items-center justify-center">
                <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, rgba(247, 149, 48, 0.4) 10%, rgba(247, 149, 48, 0) 30%)">
                    <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20 flex flex-col items-center" style="border-radius: 53px">
                        <div class="gap-4 flex flex-col items-center">
                            <div class="flex justify-center items-center border-2 border-orange-500 rounded-full" style="width: 3.2rem; height: 3.2rem">
                                <i class="text-orange-500 pi pi-fw pi-lock !text-2xl"></i>
                            </div>
                            <h1 class="text-surface-900 dark:text-surface-0 font-bold text-4xl lg:text-5xl mb-2">Acceso Denegado</h1>
                            <span class="text-muted-color mb-8">No tiene los permisos necesarios. Por favor, contacte a los administradores.</span>
                            <img ngSrc="assets/img/asset-access.svg" alt="Not Access" class="custom-image" width="220" height="158" />
                            <div class="col-span-12 mt-8 text-center flex gap-3 justify-center">
                                <p-button label="Volver" (onClick)="goToPreviousPage()" severity="secondary" styleClass="p-button-outlined" />
                                <p-button label="Ir al Panel principal" (onClick)="goHome()" severity="warn" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`
})
export class Access implements OnInit {
    previousUrl = '';

    private readonly location = inject(Location);

    private readonly router = inject(Router);

    ngOnInit() {
        // Obtenemos la URL anterior del estado de navegación
        const navigation = this.router.getCurrentNavigation();
        this.previousUrl = navigation?.extras?.state?.['previousUrl'] || '';
    }

    goToPreviousPage() {
        if (this.previousUrl) {
            // Si tenemos una URL anterior registrada, navegamos a ella
            this.router
                .navigateByUrl(this.previousUrl)
                .then()
                .catch(() => undefined);
        } else {
            // Fallback: volver atrás en el historial
            this.location.back();
        }
    }

    goHome() {
        this.router
            .navigate(['/'])
            .then()
            .catch(() => undefined);
    }
}
