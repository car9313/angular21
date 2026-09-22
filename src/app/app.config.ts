import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, inject, provideAppInitializer, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation, withInMemoryScrolling } from '@angular/router';
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { PRIMENG_ES_TRANSLATION } from './core/constants/primeng-es-translation';
import { appRoutes } from './app.routes';
import { ConfigService } from './core/services/config.service';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { RestoreSessionUseCase } from './modules/auth/application/restore-session.use-case';

export const appConfig: ApplicationConfig = {
    providers: [
        // Block app bootstrap until the runtime config is loaded, then
        // rehydrate the session from storage (F5 must not log the user out).
        // inject() is only valid in the SYNCHRONOUS part of this callback —
        // capture both instances first, then await (NG0203 otherwise).
        provideAppInitializer(() => {
            const config = inject(ConfigService);
            const restore = inject(RestoreSessionUseCase);
            return (async () => {
                await config.load();
                await restore.execute();
            })();
        }),
        provideRouter(appRoutes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }), withEnabledBlockingInitialNavigation()),
        provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
        provideZonelessChangeDetection(),
        providePrimeNG({ theme: { preset: Aura, options: { darkModeSelector: '.app-dark' } }, translation: PRIMENG_ES_TRANSLATION })
    ]
};
