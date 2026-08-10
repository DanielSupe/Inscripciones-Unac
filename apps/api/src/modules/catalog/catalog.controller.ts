import type { RequestHandler } from 'express';
import * as catalogService from './catalog.service';

/**
 * Programas ofertados y periodo abierto.
 *
 * `openPeriod` en nulo es una respuesta legítima, no un error: significa que no
 * hay inscripciones abiertas, y el frontend lo usa para mostrar un mensaje en
 * lugar de un formulario que nadie podría enviar.
 */
export const getCatalog: RequestHandler = async (_req, res, next) => {
  try {
    res.status(200).json(await catalogService.getCatalog());
  } catch (error) {
    next(error);
  }
};
