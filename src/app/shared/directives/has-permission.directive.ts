import { Directive, TemplateRef, ViewContainerRef, computed, effect, inject, input } from '@angular/core';
import { SessionStore } from '../../core/store/session.store';

/**
 * Structural permission gate backed by SessionStore — the SINGLE evaluator.
 *
 * Reactive by design: the check is a `computed` over signals, so the view
 * re-renders whenever the session permissions change (login, logout, and the
 * 403 identity self-heal) without needing a parent to re-render first.
 *
 * Microsyntax:
 *   *appHasPermission="let ok; resource: resource(); actions: actions()"
 *
 * NOTE: Angular desugars a structural microsyntax by prefixing every key with
 * the directive name and capitalising it (`*ngFor="... of x"` -> `ngForOf`,
 * `*ngTemplateOutlet="context: c"` -> `ngTemplateOutletContext`). So the key
 * `resource` on `[appHasPermission]` binds the input `appHasPermissionResource`.
 *
 * Writing the input's own name as the key would produce
 * `appHasPermissionHasPermissionResource`, which binds to nothing: the inputs
 * stay at their defaults, `hasPermission('')` returns false, and the gate fails
 * CLOSED — silently hiding every gated control.
 *
 * Context handed to the template: `{ ok: boolean }`.
 */
@Directive({
    selector: '[appHasPermission]'
})
export class HasPermissionDirective {
    /**
     * Signal inputs (not `input.required()`): Angular's required-input check
     * does not recognise bindings declared through structural microsyntax and
     * fails with NG8008 even when they are present.
     *
     * Names follow the `<directiveName><Input>` shape Angular derives from the
     * microsyntax keys above.
     *
     * Defaults are deliberate — an unbound gate renders NOTHING, i.e. it fails
     * CLOSED, which is the right failure mode for a permission check.
     */
    readonly appHasPermissionResource = input('');
    readonly appHasPermissionActions = input<string[]>([]);

    private readonly tpl = inject(TemplateRef<{ ok: boolean }>);
    private readonly vc = inject(ViewContainerRef);
    private readonly session = inject(SessionStore);

    private readonly allowed = computed(() =>
        this.session.hasPermission(this.appHasPermissionResource(), this.appHasPermissionActions())
    );

    constructor() {
        effect(() => {
            const ok = this.allowed();
            this.vc.clear();
            if (ok) {
                this.vc.createEmbeddedView(this.tpl, { ok });
            }
        });
    }
}
