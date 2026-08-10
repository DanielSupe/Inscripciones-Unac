import type { SessionUser } from '@repo/contracts';
import type { User } from './users.repository';

/**
 * Convierte la entidad en la identidad pública.
 *
 * Es el único camino por el que un usuario sale de este módulo, y enumera los
 * campos uno a uno en vez de excluir los sensibles. Así una columna nueva en el
 * modelo no se filtra sola por haberla añadido.
 */
export function toSessionUser(user: User): SessionUser {
  return {
    id: user.id,
    documentType: user.documentType,
    documentNumber: user.documentNumber,
    email: user.email,
    role: user.role,
  };
}
