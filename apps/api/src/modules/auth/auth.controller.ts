import type { RequestHandler } from 'express';
import { loginRequestSchema, registerRequestSchema } from '@repo/contracts';
import { UnauthorizedError, ValidationError } from '../../shared/errors';
import { clearSessionCookie, setSessionCookie } from '../../shared/session/cookie';
import { issueSessionToken } from '../../shared/session/token';
import * as authService from './auth.service';

/**
 * Traduce los problemas de validación a un detalle por campo, utilizable
 * directamente por el formulario.
 *
 * Se tipa por la forma del problema y no importando Zod, para no añadirlo como
 * dependencia directa del API: aquí solo llegan esquemas ya construidos en
 * `@repo/contracts`.
 */
interface ValidationIssue {
  readonly path: readonly PropertyKey[];
  readonly message: string;
}

function fieldErrors(issues: readonly ValidationIssue[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of issues) {
    const field = issue.path.map(String).join('.');
    result[field] ??= issue.message;
  }
  return result;
}

export const register: RequestHandler = async (req, res, next) => {
  try {
    // El esquema enumera los campos admitidos, así que `role` o `isSystem` en
    // el cuerpo se descartan aquí y no llegan a la capa de datos.
    const parsed = registerRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(
        'Revisa los datos del formulario.',
        fieldErrors(parsed.error.issues),
      );
    }

    const user = await authService.register(parsed.data);
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

export const login: RequestHandler = async (req, res, next) => {
  try {
    const parsed = loginRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      // Un cuerpo mal formado no debe distinguirse de unas credenciales
      // incorrectas: también sirve para sondear.
      throw new UnauthorizedError('El correo o la contraseña no son correctos.');
    }

    const user = await authService.login(parsed.data);

    // El token viaja solo en la cookie. El cuerpo lleva la identidad, nunca la
    // credencial.
    setSessionCookie(res, issueSessionToken(user.id));
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const logout: RequestHandler = (_req, res) => {
  // Idempotente: cerrar sesión sin tenerla no es un error.
  clearSessionCookie(res);
  res.status(204).send();
};

export const me: RequestHandler = (req, res) => {
  // requireAuth ya resolvió y validó la sesión.
  res.status(200).json(req.session);
};
