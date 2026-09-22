import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, inject, provideAppInitializer, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation, withInMemoryScrolling } from '@angular/router';
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { PRIMENG_ES_TRANSLATION } from './core/constants/primeng-es-translation';
import { appRoutes } from './app.routes';
import { ConfigService } from './core/services/config.service';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
    providers: [
        // Runtime config MUST load before bootstrap: every API URL is built
        // via ConfigService.urlWith, which THROWS when the config is absent
        // (a missing load would break the very first login request with a
        // misleading "wrong credentials" client-side error and no request
        // sent). Session restoration is NOT here — it is owned by the
        // guards' one-shot barrier (SessionReadyService).
        provideAppInitializer(() => inject(ConfigService).load()),
        provideRouter(appRoutes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }), withEnabledBlockingInitialNavigation()),
        provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
        provideZonelessChangeDetection(),
        providePrimeNG({ theme: { preset: Aura, options: { darkModeSelector: '.app-dark' } }, translation: PRIMENG_ES_TRANSLATION })
    ]
};
