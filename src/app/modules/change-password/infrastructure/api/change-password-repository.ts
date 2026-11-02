import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { ChangePassword } from '../../domain/change-password';
import { ConfigService } from '@/app/core/services/config.service';

@Injectable({
    providedIn: 'root'
})
export class ChangePasswordRepository {
    private http = inject(HttpClient);
    private configService = inject(ConfigService);
    private readonly baseUrl = this.configService.url;

    changePassword(entity: ChangePassword): Observable<HttpResponse<void>> {
        return this.http
            .post<void>(`${this.baseUrl}/api/users/change-custom-password`, entity, {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json'
                }),
                observe: 'response'
            })
            .pipe(catchError(this.handleError));
    }

    protected handleError(error: HttpErrorResponse): Observable<never> {
        // Aquí puedes agregar lógica personalizada: logging, notificaciones, etc.
        console.error('[CRUD ERROR]', error);
        return throwError(() => error);
    }
}
