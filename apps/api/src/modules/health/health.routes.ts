import { Router } from 'express';
import { getHealth } from './health.controller';

export const healthRoutes: Router = Router();

// Público a propósito: sirve para verificar un despliegue antes de que exista
// ninguna cuenta con la que autenticarse.
healthRoutes.get('/health', getHealth);
