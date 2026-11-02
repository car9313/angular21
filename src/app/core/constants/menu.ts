import { MenuItem } from 'primeng/api';
import { ACTIONS, Action } from './actions';
import { RESOURCES, Resource } from './resources';

export interface SecuredMenuItem extends MenuItem {
    resource?: Resource;
    requiredActions?: Action[];
    alwaysVisible?: boolean;
    items?: SecuredMenuItem[];
}

export const MENU_ITEMS: SecuredMenuItem[] = [
    {
        label: 'Inicio',
        items: [
            {
                label: 'Panel principal',
                icon: 'pi pi-fw pi-home',
                path: '/panel-principal',
                routerLink: ['/panel-principal']
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
                        path: '/seguridad/usuarios',
                        routerLink: ['/seguridad/usuarios'],
                        resource: RESOURCES.Users,
                        requiredActions: [ACTIONS.Read]
                    },
                    {
                        label: 'Roles',
                        icon: 'pi pi-fw pi-id-card',
                        path: '/seguridad/roles',
                        routerLink: ['/seguridad/roles'],
                        resource: RESOURCES.Roles,
                        requiredActions: [ACTIONS.Read]
                    },
                    {
                        label: 'Auditorías',
                        icon: 'pi pi-fw pi-history',
                        path: '/seguridad/auditorias',
                        routerLink: ['/seguridad/auditorias'],
                        resource: RESOURCES.Audits,
                        requiredActions: [ACTIONS.Read]
                    },
                    {
                        label: 'Parámetros del sistema',
                        icon: 'pi pi-fw pi-cog',
                        path: '/seguridad/configuracion',
                        routerLink: ['/seguridad/configuracion'],
                        resource: RESOURCES.SecConfig,
                        requiredActions: [ACTIONS.Update]
                    }
                ]
            }
        ]
    },
    {
        label: 'Configuración',
        icon: 'pi pi-fw pi-sliders-h',
        items: [
            {
                label: 'Nomencladores',
                icon: 'pi pi-fw pi-tags',
                items: [
                    {
                        label: 'Países',
                        icon: 'pi pi-fw pi-flag',
                        path: '/nomencladores/paises',
                        routerLink: ['/nomencladores/paises'],
                        resource: RESOURCES.Nomenclators,
                        requiredActions: [ACTIONS.Read]
                    },
                    {
                        label: 'Provincias',
                        icon: 'pi pi-fw pi-flag',
                        path: '/nomencladores/provincias',
                        routerLink: ['/nomencladores/provincias'],
                        resource: RESOURCES.Nomenclators,
                        requiredActions: [ACTIONS.Read]
                    },
                    {
                        label: 'Municipios',
                        icon: 'pi pi-fw pi-flag',
                        path: '/nomencladores/municipios',
                        routerLink: ['/nomencladores/municipios'],
                        resource: RESOURCES.Nomenclators,
                        requiredActions: [ACTIONS.Read]
                    }
                ]
            }
        ]
    }
];
