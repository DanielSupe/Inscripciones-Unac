import express, { type Express } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from '@repo/config/server';
import { errorHandler, notFoundHandler } from './shared/errors';
import { healthRoutes } from './modules/health/health.routes';
import { authRoutes } from './modules/auth/auth.routes';
import { catalogRoutes } from './modules/catalog/catalog.routes';
import { enrollmentRoutes } from './modules/enrollment/enrollment.routes';
import { documentsRoutes } from './modules/documents/documents.routes';
import { receiptRoutes } from './modules/receipt/receipt.routes';
import { usersAdminRoutes } from './modules/users/users.admin.routes';
import { enrollmentAdminRoutes } from './modules/enrollment/enrollment.admin.routes';
import { enrollmentDeanRoutes } from './modules/enrollment/enrollment.dean.routes';
import { interviewRoutes } from './modules/interview/interview.routes';
import { catalogAdminRoutes } from './modules/catalog/catalog.admin.routes';
import { receiptAdminRoutes } from './modules/receipt/receipt.admin.routes';

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
  app.use(cookieParser());

  app.use(healthRoutes);
  app.use(authRoutes);
  app.use(catalogRoutes);
  app.use(enrollmentRoutes);
  app.use(documentsRoutes);
  app.use(receiptRoutes);

  // Consola de administración. Cada archivo monta sus rutas ya protegidas.
  app.use(usersAdminRoutes);
  app.use(enrollmentAdminRoutes);
  app.use(enrollmentDeanRoutes);
  app.use(interviewRoutes);
  app.use(catalogAdminRoutes);
  app.use(receiptAdminRoutes);

  // El orden importa: primero la ruta no encontrada, y el manejador de errores
  // siempre al final.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
