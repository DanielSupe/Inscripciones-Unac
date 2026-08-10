import { Router } from 'express';
import { requireAuth, requireRole } from '../../shared/middleware/require-auth';
import * as enrollmentController from './enrollment.controller';

export const enrollmentRoutes: Router = Router();

// Todas protegidas. Consultar lo puede hacer cualquiera de los tres roles —cada
// uno verá solo lo suyo, salvo ADMIN—, pero diligenciar y enviar es cosa del
// aspirante: quien ya es estudiante tiene su proceso terminado.
const puedeConsultar = requireRole('APPLICANT', 'STUDENT', 'ADMIN');
const puedeDiligenciar = requireRole('APPLICANT');

enrollmentRoutes.get('/enrollments/current', requireAuth, puedeConsultar, enrollmentController.getCurrent);
enrollmentRoutes.post('/enrollments', requireAuth, puedeDiligenciar, enrollmentController.start);
enrollmentRoutes.get('/enrollments/:id', requireAuth, puedeConsultar, enrollmentController.getById);
enrollmentRoutes.patch('/enrollments/:id', requireAuth, puedeDiligenciar, enrollmentController.saveDraft);
enrollmentRoutes.post('/enrollments/:id/submit', requireAuth, puedeDiligenciar, enrollmentController.submit);
enrollmentRoutes.post('/enrollments/:id/reopen', requireAuth, puedeDiligenciar, enrollmentController.reopen);
