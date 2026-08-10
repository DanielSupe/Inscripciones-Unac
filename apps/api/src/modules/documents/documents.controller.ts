import type { RequestHandler } from 'express';
import { attachmentTypeSchema, uploadTicketRequestSchema } from '@repo/contracts';
import { UnauthorizedError, ValidationError } from '../../shared/errors';
import * as documentsService from './documents.service';

function sessionOf(req: Parameters<RequestHandler>[0]) {
  if (!req.session) throw new UnauthorizedError('Necesitas iniciar sesión para hacer esto.');
  return req.session;
}

function enrollmentIdOf(req: Parameters<RequestHandler>[0]): string {
  const id = req.params['id'];
  if (typeof id !== 'string' || id.length === 0) {
    throw new ValidationError('Falta el identificador de la inscripción.');
  }
  return id;
}

function parseTicketRequest(body: unknown) {
  const parsed = uploadTicketRequestSchema.safeParse(body);
  if (!parsed.success) {
    const details: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      details[issue.path.map(String).join('.')] ??= issue.message;
    }
    // Un tipo de archivo no admitido cae aquí, con la lista de los que sí.
    throw new ValidationError('Solo se admiten archivos PDF, JPG o PNG.', details);
  }
  return parsed.data;
}

export const requestUpload: RequestHandler = async (req, res, next) => {
  try {
    const ticket = await documentsService.requestUploadTicket(
      enrollmentIdOf(req),
      sessionOf(req),
      parseTicketRequest(req.body),
    );
    res.status(200).json(ticket);
  } catch (error) {
    next(error);
  }
};

export const confirmUpload: RequestHandler = async (req, res, next) => {
  try {
    await documentsService.confirmUpload(
      enrollmentIdOf(req),
      sessionOf(req),
      parseTicketRequest(req.body),
    );
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const getDownloadUrl: RequestHandler = async (req, res, next) => {
  try {
    const type = attachmentTypeSchema.safeParse(req.params['type']);
    if (!type.success) throw new ValidationError('Ese tipo de documento no existe.');

    const url = await documentsService.requestDownloadUrl(
      enrollmentIdOf(req),
      sessionOf(req),
      type.data,
    );
    res.status(200).json({ url });
  } catch (error) {
    next(error);
  }
};
