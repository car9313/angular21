import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import type { MenuItemCommandEvent } from 'primeng/api';
import { SessionStore } from '../../core/store/session.store';
import { LogoutService } from '../../core/services/logout.service';
import { UserMenu } from './app.user-menu';

describe('UserMenu', () => {
    let store: InstanceType<typeof SessionStore>;
    let logoutSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        logoutSpy = vi.fn().mockResolvedValue(undefined);
        TestBed.configureTestingModule({
            providers: [{ provide: LogoutService, useValue: { logout: logoutSpy } }]
        });
        store = TestBed.inject(SessionStore);
        store.setUser(null);
    });

    it('renders the initials trigger for the current user', () => {
        store.setUser({ id: '1', username: 'aruiz', fullName: 'Ana Ruiz', roles: ['Admin'] });
        const fixture = TestBed.createComponent(UserMenu);
        fixture.detectChanges();

        const trigger = (fixture.nativeElement as HTMLElement).querySelector('.user-menu-avatar');
        expect(trigger?.textContent?.trim()).toBe('AR');
    });

    it('renders nothing when there is no authenticated user', () => {
        const fixture = TestBed.createComponent(UserMenu);
        fixture.detectChanges();

        expect((fixture.nativeElement as HTMLElement).querySelector('.user-menu-avatar')).toBeNull();
    });

    it('logout item clears the session through the LogoutService', async () => {
        store.setUser({ id: '1', username: 'aruiz', fullName: 'Ana Ruiz', roles: ['Admin'] });
        const fixture = TestBed.createComponent(UserMenu);
        fixture.detectChanges();

        const logoutItem = fixture.componentInstance.menuItems().find((item) => item.label === 'Log out');
        logoutItem?.command?.({ originalEvent: new Event('click') } as unknown as MenuItemCommandEvent);

        await Promise.resolve();

        expect(logoutSpy).toHaveBeenCalledOnce();
    });
});
