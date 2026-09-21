import { Directive, Input, TemplateRef, ViewContainerRef, OnChanges, inject } from '@angular/core';
import { PermissionService } from '../../core/services/permission.service';
import { TokenAuthService } from '../../modules/auth/infrastructure/storage/token-auth.service';

@Directive({
    selector: '[appHasPermission]'
})
export class HasPermissionDirective implements OnChanges {
    @Input() hasPermissionResource!: string;
    @Input() hasPermissionActions!: string[];

    private readonly tpl = inject(TemplateRef<unknown>);

    private readonly vc = inject(ViewContainerRef);

    private readonly perm = inject(PermissionService);

    private readonly tokenAuthService = inject(TokenAuthService);

    ngOnChanges() {
        const roles = this.tokenAuthService.userRoles;
        const { hasAll } = this.perm.checkPermissions({
            roles,
            resource: this.hasPermissionResource,
            actions: this.hasPermissionActions
        });
        this.vc.clear();
        if (hasAll) {
            this.vc.createEmbeddedView(this.tpl);
        }
    }
}