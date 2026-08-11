import { Router } from 'express';
import { requireAuth, requireRole } from '../../shared/middleware/require-auth';
import * as controller from './users.admin.controller';

export const usersAdminRoutes: Router = Router();

// Todas reservadas a ADMIN, sin excepción. Van en su propio archivo para que
// baste mirarlo y ver qué está protegido.
const soloAdmin = [requireAuth, requireRole('ADMIN')] as const;

usersAdminRoutes.get('/admin/users', ...soloAdmin, controller.list);
usersAdminRoutes.post('/admin/users', ...soloAdmin, controller.create);
usersAdminRoutes.get('/admin/users/:id', ...soloAdmin, controller.getById);
usersAdminRoutes.patch('/admin/users/:id', ...soloAdmin, controller.update);
usersAdminRoutes.delete('/admin/users/:id', ...soloAdmin, controller.remove);
usersAdminRoutes.post('/admin/users/:id/password', ...soloAdmin, controller.resetPassword);
