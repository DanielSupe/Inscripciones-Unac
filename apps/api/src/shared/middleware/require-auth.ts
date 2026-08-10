import type { RequestHandler } from 'express';
import type { Role } from '@repo/contracts';
import { ForbiddenError, UnauthorizedError } from '../errors';
import { readSessionCookie } from '../session/cookie';
import { readSessionToken } from '../session/token';
import * as authService from '../../modules/auth/auth.service';
import '../session/types';

const SIN_SESION = 'Necesitas iniciar sesión para hacer esto.';
const SIN_PERMISO = 'No tienes permiso para hacer esto.';

/**
 * Resuelve la sesión y la deja disponible para el resto de la cadena.
 *
 * Verifica la firma y además consulta la cuenta: el token solo dice quién eres,
 * y puede sobrevivir a que la cuenta se elimine o cambie de rol.
 */
export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const token = readSessionCookie(req.cookies as Record<string, unknown>);
    if (!token) throw new UnauthorizedError(SIN_SESION);

    const userId = readSessionToken(token);
    if (!userId) throw new UnauthorizedError(SIN_SESION);

    const session = await authService.resolveSession(userId);
    if (!session) throw new UnauthorizedError(SIN_SESION);

    req.session = session;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Exige uno de los roles indicados. Se monta siempre después de `requireAuth`.
 *
 * Responde 403 y no 404: quien tiene sesión pero no permiso ya sabe que la ruta
 * existe, porque acaba de recibir una respuesta de ella. Lo que no debe deducir
 * es si el recurso concreto que pidió existe, y eso lo garantiza que la
 * comprobación ocurra antes de tocar la base de datos.
 */
export function requireRole(...roles: readonly Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.session) {
      next(new UnauthorizedError(SIN_SESION));
      return;
    }
    if (!roles.includes(req.session.role)) {
      next(new ForbiddenError(SIN_PERMISO));
      return;
    }
    next();
  };
}
