import type { ApiErrorCode } from '@repo/contracts';

/**
 * Error de negocio, lanzado desde los services.
 *
 * Los services no conocen Express, así que no eligen códigos HTTP: eligen un
 * código de dominio. El middleware de errores es el único que traduce ese
 * código a una respuesta HTTP.
 */
export abstract class DomainError extends Error {
  abstract readonly code: ApiErrorCode;
  abstract readonly httpStatus: number;

  /** Datos adicionales seguros de mostrar al cliente. */
  readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = new.target.name;
    this.details = details;
  }
}

/** El recurso pedido no existe, o quien pregunta no tiene derecho a saberlo. */
export class NotFoundError extends DomainError {
  readonly code = 'NOT_FOUND' as const;
  readonly httpStatus = 404;
}

/** La operación choca con el estado actual: un duplicado, una transición inválida. */
export class ConflictError extends DomainError {
  readonly code = 'CONFLICT' as const;
  readonly httpStatus = 409;
}

/** Hay sesión, pero el rol no alcanza para esta operación. */
export class ForbiddenError extends DomainError {
  readonly code = 'FORBIDDEN' as const;
  readonly httpStatus = 403;
}

/** No hay sesión, o expiró. */
export class UnauthorizedError extends DomainError {
  readonly code = 'UNAUTHORIZED' as const;
  readonly httpStatus = 401;
}

/** La entrada no cumple el contrato. `details` lleva el detalle por campo. */
export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR' as const;
  readonly httpStatus = 400;
}

/** Una dependencia del sistema no responde. No es culpa de quien llama. */
export class ServiceUnavailableError extends DomainError {
  readonly code = 'SERVICE_UNAVAILABLE' as const;
  readonly httpStatus = 503;
}
