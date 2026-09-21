import { Directive, Input, TemplateRef, ViewContainerRef, OnChanges } from '@angular/core';
import { PermissionService } from '../../core/services/permission.service';
import { TokenAuthService } from '../../modules/auth/infrastructure/storage/token-auth.service';

@Directive({
    selector: '[hasPermission]'
})
export class HasPermissionDirective implements OnChanges {
    @Input('hasPermissionResource') resource!: string;
    @Input('hasPermissionActions') actions!: string[];

    constructor(
        private tpl: TemplateRef<any>,
        private vc: ViewContainerRef,
        private perm: PermissionService,
        private tokenAuthService: TokenAuthService
    ) {}

    ngOnChanges() {
        const roles = this.tokenAuthService.userRoles;
        const { hasAll } = this.perm.checkPermissions({
            roles,
            resource: this.resource,
            actions: this.actions
        });
        this.vc.clear();
        if (hasAll) {
            this.vc.createEmbeddedView(this.tpl);
        }
    }
}
