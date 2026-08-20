import { Router } from 'express';
import { requireAuth, requireRole } from '../../shared/middleware/require-auth';
import * as controller from './interview.controller';

export const interviewRoutes: Router = Router();

// Agendar y declarar el resultado son del decano, y de nadie más: ni el
// administrador ni el aspirante intervienen en la cita.
const soloDecano = [requireAuth, requireRole('DEAN')] as const;

interviewRoutes.post('/dean/enrollments/:id/interview', ...soloDecano, controller.schedule);
interviewRoutes.patch('/dean/enrollments/:id/interview', ...soloDecano, controller.reschedule);
interviewRoutes.post(
  '/dean/enrollments/:id/interview/outcome',
  ...soloDecano,
  controller.declareOutcome,
);
