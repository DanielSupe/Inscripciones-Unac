import express, { type Express } from 'express';
import cors from 'cors';
import { env } from '@repo/config/server';
import { errorHandler, notFoundHandler } from './shared/errors';
import { healthRoutes } from './modules/health/health.routes';

/**
 * Construye la aplicación sin ponerla a escuchar.
 *
 * Separar esto de `index.ts` permite montarla en las pruebas con Supertest sin
 * ocupar un puerto.
 */
export function createApp(): Express {
  const app = express();

  // Origen exacto y credenciales habilitadas. Con `*` el navegador rechaza las
  // peticiones que llevan cookie, y el frontend vivirá en otro dominio.
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );

  app.use(express.json());

  app.use(healthRoutes);

  // El orden importa: primero la ruta no encontrada, y el manejador de errores
  // siempre al final.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
