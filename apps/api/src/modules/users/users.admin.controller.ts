import type { RequestHandler } from 'express';
import {
  createUserSchema,
  resetPasswordSchema,
  updateUserSchema,
  userQuerySchema,
} from '@repo/contracts';
import { UnauthorizedError, ValidationError } from '../../shared/errors';
import * as adminService from './users.admin.service';

function sessionOf(req: Parameters<RequestHandler>[0]) {
  if (!req.session) throw new UnauthorizedError('Necesitas iniciar sesión para hacer esto.');
  return req.session;
}

function idOf(req: Parameters<RequestHandler>[0]): string {
  const id = req.params['id'];
  if (typeof id !== 'string' || id.length === 0) {
    throw new ValidationError('Falta el identificador de la cuenta.');
  }
  return id;
}

/** Traduce los problemas de validación a un detalle por campo. */
function fieldErrors(
  issues: readonly { path: readonly PropertyKey[]; message: string }[],
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of issues) {
    result[issue.path.map(String).join('.')] ??= issue.message;
  }
  return result;
}

export const list: RequestHandler = async (req, res, next) => {
  try {
    const parsed = userQuerySchema.safeParse(req.query);
    if (!parsed.success) throw new ValidationError('Parámetros de búsqueda inválidos.');

    res.status(200).json(await adminService.list(parsed.data));
  } catch (error) {
    next(error);
  }
};

export const getById: RequestHandler = async (req, res, next) => {
  try {
    res.status(200).json(await adminService.getById(idOf(req)));
  } catch (error) {
    next(error);
  }
};

export const create: RequestHandler = async (req, res, next) => {
  try {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Revisa los datos de la cuenta.', fieldErrors(parsed.error.issues));
    }

    res.status(201).json(await adminService.create(parsed.data));
  } catch (error) {
    next(error);
  }
};

export const update: RequestHandler = async (req, res, next) => {
  try {
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Revisa los datos de la cuenta.', fieldErrors(parsed.error.issues));
    }

    res.status(200).json(await adminService.update(idOf(req), sessionOf(req), parsed.data));
  } catch (error) {
    next(error);
  }
};

export const remove: RequestHandler = async (req, res, next) => {
  try {
    await adminService.remove(idOf(req), sessionOf(req));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const resetPassword: RequestHandler = async (req, res, next) => {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Revisa la contraseña.', fieldErrors(parsed.error.issues));
    }

    await adminService.resetPassword(idOf(req), parsed.data.password);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
