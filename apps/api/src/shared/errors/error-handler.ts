import type { ErrorRequestHandler, RequestHandler } from 'express';
import type { ApiErrorBody } from '@repo/contracts';
import { DomainError, NotFoundError } from './domain-error';

/**
 * Único punto donde un error se convierte en respuesta HTTP.
 *
 * Los controllers nunca arman una respuesta de error a mano: lanzan, o dejan
 * que lo que llamaron lance, y esto decide el código y el cuerpo. Así la forma
 * de la respuesta es literalmente la misma en todos los endpoints, que es lo
 * que permite al frontend tiparla una sola vez.
 */
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof DomainError) {
    const body: ApiErrorBody = {
      error: {
        code: error.code,
        message: error.message,
        ...(error.details === undefined ? {} : { details: error.details }),
      },
    };
    res.status(error.httpStatus).json(body);
    return;
  }

  // Un error que no reconocemos es un fallo nuestro. Se registra entero en el
  // servidor, donde sí sirve, y al cliente le llega un mensaje genérico: ni
  // trazas, ni mensajes crudos del ORM, ni nombres de tablas.
  console.error('[error no controlado]', error);

  const body: ApiErrorBody = {
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Ocurrió un error inesperado. Inténtalo de nuevo más tarde.',
    },
  };
  res.status(500).json(body);
};

/** Cualquier ruta no montada responde con la misma forma que el resto. */
export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(new NotFoundError('El recurso solicitado no existe.'));
};
