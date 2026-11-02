export const CONST_ROUTES = {
    root: '',
    panelPrincipal: 'panel-principal',
    seguridad: 'seguridad',
    nomencladores: 'nomencladores',
    perfil: 'perfil',
    cambiarContrasena: 'cambiar-contraseña',

    roles: 'roles',
    usuarios: 'usuarios',
    auditorias: 'auditorias',
    configuracion: 'configuracion',

    notfound: 'notfound',
    auth: 'auth'
} as const;

// Tipo útil para recibir una ruta como parámetro de función
export type AppRoute = (typeof CONST_ROUTES)[keyof typeof CONST_ROUTES];

// Helper para construir URLs absolutas con segmentos opcionales
export function url(...segments: readonly (string | undefined | null)[]): string {
    const clean = segments.filter((s): s is string => !!s && s.length > 0);
    return '/' + clean.join('/');
}
