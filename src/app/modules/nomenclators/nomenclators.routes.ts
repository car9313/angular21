import { permissionGuard } from '../../core/guards/permission.guard';
import { Routes } from '@angular/router';
import { RESOURCES } from '@/app/core/constants/resources';


export const nomenclatorRoutes: Routes = [
    {
        path: 'paises',
        loadComponent: () => import('./countries/presentation/pages/countries.page/countries.page').then((m) => m.CountriesPage),
        canActivate: [permissionGuard],
        data: {
            resource: RESOURCES.Nomenclators,
            breadcrumb: 'Países',
            title: 'Países'
        }
    },
    {
        path: 'provincias',
        loadComponent: () => import('./provinces/presentation/pages/provinces.page/provinces.page').then((m) => m.ProvincesPage),
        canActivate: [permissionGuard],
        data: {
            resource: RESOURCES.Nomenclators,
            breadcrumb: 'Provincias',
            title: 'Provincias'
        }
    },
    {
        path: 'municipios',
        loadComponent: () => import('./municipalities/presentation/pages/municipality.page/municipality.page').then((m) => m.MunicipalityPage),
        canActivate: [permissionGuard],
        data: {
            resource: RESOURCES.Nomenclators,
            breadcrumb: 'Municipios',
            title: 'Municipios'
        }
    },
    { path: 'países', redirectTo: 'paises', pathMatch: 'full' },
    { path: '**', redirectTo: '/notfound' }
];
