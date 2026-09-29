import { Router } from 'express';
import { requireAuth, requireRole } from '../../shared/middleware/require-auth';
import * as controller from './goals.controller';

export const goalsAdminRoutes: Router = Router();

// Todas reservadas a ADMIN, sin excepción.
const soloAdmin = [requireAuth, requireRole('ADMIN')] as const;

goalsAdminRoutes.get('/admin/faculty-goals', ...soloAdmin, controller.list);
goalsAdminRoutes.put('/admin/faculty-goals/:facultyId', ...soloAdmin, controller.setGoal);
goalsAdminRoutes.delete('/admin/faculty-goals/:facultyId', ...soloAdmin, controller.clearGoal);
