import { MenuItem } from 'primeng/api';
import { ACTIONS, Action } from './actions';
import { RESOURCES, Resource } from './resources';

/**
 * Menu item with RBAC metadata.
 * - resource: permission resource (typed union — typos are compile errors)
 *   required to see the leaf.
 * - requiredActions: actions required on that resource (defaults downstream
 *   to Read when omitted).
 * - alwaysVisible: ALWAYS visible even if the resource is not granted
 *   (e.g. generic entries).
 */
export interface SecuredMenuItem extends MenuItem {
    resource?: Resource;
    requiredActions?: Action[];
    alwaysVisible?: boolean;
    items?: SecuredMenuItem[];
}

/**
 * Spanish menu tree. Groups without a resource are always visible; leaves
 * with a resource are filtered by the SessionStore permissions.
 */
export const MENU_ITEMS: SecuredMenuItem[] = [
    {
        label: 'Inicio',
        items: [
            {
                label: 'Panel principal',
                icon: 'pi pi-fw pi-home',
                routerLink: ['/panel-principal'],
                resource: RESOURCES.Panel,
                requiredActions: [ACTIONS.Read]
            }
        ]
    },
    {
        label: 'Administración',
        icon: 'pi pi-fw pi-briefcase',
        items: [
            {
                label: 'Seguridad',
                icon: 'pi pi-fw pi-lock',
                items: [
                    {
                        label: 'Usuarios',
                        icon: 'pi pi-fw pi-users',
                        routerLink: ['/seguridad/usuarios'],
                        resource: RESOURCES.Users,
                        requiredActions: [ACTIONS.Read]
                    },
                    {
                        label: 'Roles',
                        icon: 'pi pi-fw pi-id-card',
                        routerLink: ['/seguridad/roles'],
                        resource: RESOURCES.Roles,
                        requiredActions: [ACTIONS.Read]
                    },
                    {
                        label: 'Auditorías',
                        icon: 'pi pi-fw pi-history',
                        routerLink: ['/seguridad/auditorias'],
                        resource: RESOURCES.Audits,
                        requiredActions: [ACTIONS.Read]
                    },
                    {
                        label: 'Configuración',
                        icon: 'pi pi-fw pi-cog',
                        routerLink: ['/seguridad/configuracion'],
                        resource: RESOURCES.Settings,
                        requiredActions: [ACTIONS.Read]
                    }
                ]
            }
        ]
    }
];