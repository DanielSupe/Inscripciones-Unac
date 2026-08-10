import type { RequestHandler } from 'express';
import { getHealthStatus } from './health.service';

/**
 * Traduce el estado del sistema a HTTP y nada más.
 *
 * Devuelve 503 en vez de 200 con un campo `status`, porque los supervisores de
 * los hosts gratuitos deciden sobre el código HTTP y no leen el cuerpo.
 */
export const getHealth: RequestHandler = async (_req, res, next) => {
  try {
    const health = await getHealthStatus();
    res.status(health.status === 'ok' ? 200 : 503).json(health);
  } catch (error) {
    next(error);
  }
};
