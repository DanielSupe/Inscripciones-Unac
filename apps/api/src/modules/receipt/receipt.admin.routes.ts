import { Router, type RequestHandler } from 'express';
import { requireAuth, requireRole } from '../../shared/middleware/require-auth';
import { UnauthorizedError, ValidationError } from '../../shared/errors';
import * as enrollmentService from '../enrollment/enrollment.service';
import * as receiptService from './receipt.service';

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

/** `verified` decide si se marca o se deshace; la ruta es la misma. */
function setVerified(verified: boolean): RequestHandler {
  return async (req, res, next) => {
    try {
      const session = sessionOf(req);
      const id = idOf(req);

      // Pasa por la comprobación de pertenencia igual que todo lo demás; para
      // un ADMIN la atraviesa, pero la excepción sigue viviendo en un solo sitio.
      await enrollmentService.loadOwnedRow(id, session);
      await receiptService.setPaymentVerified(id, verified, session.id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}

export const receiptAdminRoutes: Router = Router();

const soloAdmin = [requireAuth, requireRole('ADMIN')] as const;

receiptAdminRoutes.post('/admin/enrollments/:id/payment/verify', ...soloAdmin, setVerified(true));
receiptAdminRoutes.post('/admin/enrollments/:id/payment/unverify', ...soloAdmin, setVerified(false));
