import { Router, type RequestHandler } from 'express';
import { rejectSchema, reviewQuerySchema } from '@repo/contracts';
import { requireAuth, requireRole } from '../../shared/middleware/require-auth';
import { UnauthorizedError, ValidationError } from '../../shared/errors';
import * as reviewService from './enrollment.review.service';

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

const list: RequestHandler = async (req, res, next) => {
  try {
    const parsed = reviewQuerySchema.safeParse(req.query);
    if (!parsed.success) throw new ValidationError('Parámetros de búsqueda inválidos.');

    res.status(200).json(await reviewService.listForReview(parsed.data));
  } catch (error) {
    next(error);
  }
};

const getDetail: RequestHandler = async (req, res, next) => {
  try {
    res.status(200).json(await reviewService.getDetail(idOf(req), sessionOf(req)));
  } catch (error) {
    next(error);
  }
};

const take: RequestHandler = async (req, res, next) => {
  try {
    res.status(200).json(await reviewService.takeForReview(idOf(req), sessionOf(req)));
  } catch (error) {
    next(error);
  }
};

const approve: RequestHandler = async (req, res, next) => {
  try {
    res.status(200).json(await reviewService.approve(idOf(req), sessionOf(req)));
  } catch (error) {
    next(error);
  }
};

const reject: RequestHandler = async (req, res, next) => {
  try {
    const parsed = rejectSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(
        'Escribe el motivo del rechazo.',
        Object.fromEntries(
          parsed.error.issues.map((i) => [i.path.map(String).join('.'), i.message]),
        ),
      );
    }

    res.status(200).json(await reviewService.reject(idOf(req), sessionOf(req), parsed.data.reason));
  } catch (error) {
    next(error);
  }
};

export const enrollmentAdminRoutes: Router = Router();

const soloAdmin = [requireAuth, requireRole('ADMIN')] as const;

enrollmentAdminRoutes.get('/admin/enrollments', ...soloAdmin, list);
enrollmentAdminRoutes.get('/admin/enrollments/:id', ...soloAdmin, getDetail);
enrollmentAdminRoutes.post('/admin/enrollments/:id/take', ...soloAdmin, take);
enrollmentAdminRoutes.post('/admin/enrollments/:id/approve', ...soloAdmin, approve);
enrollmentAdminRoutes.post('/admin/enrollments/:id/reject', ...soloAdmin, reject);
