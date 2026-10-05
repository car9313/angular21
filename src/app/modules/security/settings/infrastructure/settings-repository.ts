import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { GenericHttpService } from '../../../../core/services/generic-http.service';
import { SecuritySettings } from '../domain/security-settings';

/**
 * Repository for the global security settings singleton.
 *
 * The endpoint is the ONLY place the path lives, and the verb is encapsulated
 * here: the reference backend exposes /api/app-settings as POST for save, so a
 * future PUT change is a one-line edit without touching any consumer.
 */
@Injectable({ providedIn: 'root' })
export class SettingsRepository {
    private readonly http = inject(GenericHttpService);
    private readonly endpoint = '/api/app-settings';

    get(): Observable<SecuritySettings> {
        return this.http.getById<SecuritySettings>(this.endpoint);
    }

    save(entity: SecuritySettings): Observable<SecuritySettings> {
        return this.http.create<SecuritySettings>(this.endpoint, entity);
    }
}