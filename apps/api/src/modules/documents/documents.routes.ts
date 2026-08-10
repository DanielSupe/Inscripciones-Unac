import { Router } from 'express';
import { requireAuth, requireRole } from '../../shared/middleware/require-auth';
import * as documentsController from './documents.controller';

export const documentsRoutes: Router = Router();

const puedeAdjuntar = requireRole('APPLICANT');
const puedeConsultar = requireRole('APPLICANT', 'STUDENT', 'ADMIN');

// Todas protegidas: aquí se conceden permisos sobre documentos de identidad.
documentsRoutes.post(
  '/enrollments/:id/documents/upload-ticket',
  requireAuth,
  puedeAdjuntar,
  documentsController.requestUpload,
);
documentsRoutes.post(
  '/enrollments/:id/documents/confirm',
  requireAuth,
  puedeAdjuntar,
  documentsController.confirmUpload,
);
documentsRoutes.get(
  '/enrollments/:id/documents/:type/url',
  requireAuth,
  puedeConsultar,
  documentsController.getDownloadUrl,
);
