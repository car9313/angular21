import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { ConfigService } from '../../../../core/services/config.service';
import { AuthRequestParams } from '../../domain/auth-request-params';
import { LoginResponseBody, SessionUserDto } from '../../domain/auth-response-body';

/**
 * Auth HTTP endpoints. Promise-based (project convention) so use-cases read
 * linearly. Identity is ALWAYS fetched from the API — never decoded from
 * the token (reference-project domain decision, kept).
 */
@Injectable({ providedIn: 'root' })
export class AuthRepository {
    private readonly http = inject(HttpClient);
    private readonly config = inject(ConfigService);

    async login(params: AuthRequestParams): Promise<LoginResponseBody> {
        const response = await lastValueFrom(this.http.post<LoginResponseBody>(this.config.urlWith('/api/auth/login'), params, { observe: 'response' }));

        if (!response.body) {
            throw new Error('Authentication failed: empty response body');
        }

        return response.body;
    }

    async getCurrentUser(): Promise<SessionUserDto> {
        return lastValueFrom(this.http.get<SessionUserDto>(this.config.urlWith('/api/auth/user/current')));
    }
}
