import type { RequestHandler } from 'express';
import { enrollmentDraftSchema } from '@repo/contracts';
import { UnauthorizedError, ValidationError } from '../../shared/errors';
import * as enrollmentService from './enrollment.service';

/** La sesión ya la resolvió requireAuth; esto solo la estrecha para TypeScript. */
function sessionOf(req: Parameters<RequestHandler>[0]) {
  if (!req.session) throw new UnauthorizedError('Necesitas iniciar sesión para hacer esto.');
  return req.session;
}

function idOf(req: Parameters<RequestHandler>[0]): string {
  const id = req.params['id'];
  if (typeof id !== 'string' || id.length === 0) {
    throw new ValidationError('Falta el identificador de la inscripción.');
  }
  return id;
}

export const getCurrent: RequestHandler = async (req, res, next) => {
  try {
    res.status(200).json(await enrollmentService.findCurrent(sessionOf(req)));
  } catch (error) {
    next(error);
  }
};

export const start: RequestHandler = async (req, res, next) => {
  try {
    res.status(201).json(await enrollmentService.startOrResume(sessionOf(req)));
  } catch (error) {
    next(error);
  }
};

export const getById: RequestHandler = async (req, res, next) => {
  try {
    res.status(200).json(await enrollmentService.findById(idOf(req), sessionOf(req)));
  } catch (error) {
    next(error);
  }
};

export const saveDraft: RequestHandler = async (req, res, next) => {
  try {
    // El esquema enumera lo que se admite, así que un `status` en el cuerpo se
    // descarta aquí y no llega a la capa de datos.
    const parsed = enrollmentDraftSchema.safeParse(req.body);
    if (!parsed.success) {
      const details: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        details[issue.path.map(String).join('.')] ??= issue.message;
      }
      throw new ValidationError('Revisa los datos del formulario.', details);
    }

    res
      .status(200)
      .json(await enrollmentService.saveDraft(idOf(req), sessionOf(req), parsed.data));
  } catch (error) {
    next(error);
  }
};

export const submit: RequestHandler = async (req, res, next) => {
  try {
    res.status(200).json(await enrollmentService.submit(idOf(req), sessionOf(req)));
  } catch (error) {
    next(error);
  }
};

export const reopen: RequestHandler = async (req, res, next) => {
  try {
    res.status(200).json(await enrollmentService.reopen(idOf(req), sessionOf(req)));
  } catch (error) {
    next(error);
  }
};
