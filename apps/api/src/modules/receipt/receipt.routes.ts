import { Router } from 'express';
import { requireAuth, requireRole } from '../../shared/middleware/require-auth';
import * as receiptController from './receipt.controller';

export const receiptRoutes: Router = Router();

// Protegidas. Un estudiante conserva el acceso al recibo de la inscripción que
// le aprobaron, así que su rol también entra.
const puedeConsultar = requireRole('APPLICANT', 'STUDENT', 'ADMIN');

receiptRoutes.get('/enrollments/:id/receipt', requireAuth, puedeConsultar, receiptController.getReceipt);
receiptRoutes.get(
  '/enrollments/:id/receipt.pdf',
  requireAuth,
  puedeConsultar,
  receiptController.downloadReceipt,
);
