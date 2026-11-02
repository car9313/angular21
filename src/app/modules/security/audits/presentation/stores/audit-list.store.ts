import { signalStore, withMethods } from '@ngrx/signals';
import { withServerTable } from '@/app/core/store/features/with-server-table.feature';
import { inject } from '@angular/core';
import { AuditRepository } from '@/app/modules/security/audits/infrastructure/http/audit-repository';
import { Audit } from '@/app/modules/security/audits/domain/audit';
import { withFiltersPersistence } from '@/app/core/store/features/with-filters-persistence.feature';
import { withModal } from '@/app/core/store/features/with-modal.feature';
import { Observable } from 'rxjs';

export type AuditModalMode = 'detail';
export const AuditListStore = signalStore(
    // ─── LECTURA de servidor ───────────────────────────────────────────
    // query + entidades + loading/meta + stale responses (switchMap) +
    // selección + coordinadores de recarga. Sin escrituras ni `saving`.
    withServerTable<Audit, string>({
        repository: () => inject(AuditRepository),
        errorMessage: 'No se pudieron cargar las auditorías.',
        selectId:'id'
    }),
    // ─── Persistencia de filtros en sessionStorage ─────────────────────
    withFiltersPersistence({
        storageKey: 'audit.list.filters',
        ttlMs: 24 * 60 * 60 * 1000 // 24 horas
    }),
    // ─── Modal de auditorías (modo de pantalla) ────────────────────────
    withModal<AuditModalMode, Audit>(),

    // ─── Coordinación: modales ────────────────────────
    withMethods((store) => {
        const repository = inject(AuditRepository);
        return {
            openDetail(item: Audit): void {
                store.select(item.id);
                store.openModal('detail');
            },
            getById(id: string): Observable<Audit> {
                return repository.getById(id);
            },
            closeModalAndClearSelection(): void {
                store.closeModal();
                store.clearSelection();
            }
        };

    })
);
