import { Router } from 'express';
import { requireAuth, requireRole } from '../../shared/middleware/require-auth';
import * as controller from './dashboard.controller';

export const dashboardAdminRoutes: Router = Router();

dashboardAdminRoutes.get('/admin/dashboard', requireAuth, requireRole('ADMIN'), controller.get);
