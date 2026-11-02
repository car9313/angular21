import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';


import { Card } from 'primeng/card';
import { Divider } from 'primeng/divider';
import { Skeleton } from 'primeng/skeleton';
import { Tag } from 'primeng/tag';
import { SessionStore } from '@/app/core/store/session.store';

@Component({
    selector: 'app-user-profile',
    imports: [Card, Divider, Skeleton, Tag],
    standalone: true,
    templateUrl: './user-profile.component.html',
    styleUrl: './user-profile.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserProfileComponent {
    private router = inject(Router);
    private readonly session = inject(SessionStore);
    readonly userProfile = this.session.user;
    readonly roles = computed(() => this.session.user()?.roles ?? []);

    get initials(): string {
        const user = this.userProfile();
        if (!user?.username) return 'U';
        return user.username.charAt(0).toUpperCase();
    }

    // Método para volver al dashboard
    goBack() {
        this.router
            .navigate(['/panel-principal'])
            .then()
            .catch(() => undefined);
    }
}
