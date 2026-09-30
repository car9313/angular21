import { Injectable, inject } from '@angular/core';
import { AuthRepository } from '../infrastructure/http/auth-repository';
import { IdentityHydrator } from './identity-hydrator';

/**
 * Fail-OPEN identity refresh, triggered when the backend answers 403 to a
 * request our cached permissions still allowed.
 *
 * Purpose: make the CLIENT stop lying. It re-reads the identity so the
 * permission-gated UI (toolbar, menu, row actions) drops the action the
 * server just rejected — no F5 needed.
 *
 * Deliberately does NOT retry the rejected request: the backend already
 * decided against the database with the same token, so a retry would only
 * produce the same 403.
 *
 * Deliberately does NOT clear the session on failure (unlike
 * RestoreSessionUseCase, which is fail-closed because it runs before any
 * guard decision): the 403 already communicated the problem, and a failed
 * re-read must not log the user out.
 */
@Injectable({ providedIn: 'root' })
export class RehydrateIdentityUseCase {
    private readonly repository = inject(AuthRepository);
    private readonly hydrator = inject(IdentityHydrator);

    async execute(): Promise<void> {
        try {
            this.hydrator.apply(await this.repository.getCurrentUser());
        } catch {
            // Keep the current (possibly stale) session — see doc block.
        }
    }
}
