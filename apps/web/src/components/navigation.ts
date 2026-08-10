import type { Role } from '@repo/contracts';

export interface NavItem {
  label: string;
  /** Ausente mientras la sección no exista: se muestra en gris con «pronto». */
  to?: string;
}

export const ROLE_LABELS: Record<Role, string> = {
  APPLICANT: 'Aspirante',
  STUDENT: 'Estudiante',
  ADMIN: 'Administrador',
};

/**
 * Opciones del menú lateral por rol.
 *
 * Las que aún no existen se listan sin destino a propósito. Mostrarlas en gris
 * hace visible desde ya en qué se diferencia un rol de otro, y el change que
 * las implemente solo tiene que añadirles el destino.
 */
export const NAV_BY_ROLE: Record<Role, readonly NavItem[]> = {
  APPLICANT: [
    { label: 'Mi proceso', to: '/aspirante' },
    { label: 'Inscripción', to: '/aspirante/inscripcion' },
    { label: 'Recibo de pago', to: '/aspirante/recibo' },
  ],
  STUDENT: [
    { label: 'Mi inscripción', to: '/estudiante' },
    { label: 'Mi recibo', to: '/estudiante/recibo' },
  ],
  ADMIN: [
    { label: 'Panel', to: '/admin' },
    { label: 'Usuarios' },
    { label: 'Aspirantes' },
    { label: 'Periodos académicos' },
  ],
};
