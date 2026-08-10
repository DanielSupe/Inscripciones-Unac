import { Router } from 'express';
import { requireAuth } from '../../shared/middleware/require-auth';
import * as authController from './auth.controller';

export const authRoutes: Router = Router();

// PÚBLICAS — declaradas como tales de forma visible. Cualquier ruta que no lleve
// esta marca debe llevar requireAuth: el default del sistema es denegar.
authRoutes.post('/auth/register', authController.register); // pública
authRoutes.post('/auth/login', authController.login); // pública
authRoutes.post('/auth/logout', authController.logout); // pública (idempotente)

// PROTEGIDAS
authRoutes.get('/auth/me', requireAuth, authController.me);
