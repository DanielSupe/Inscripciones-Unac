import { z } from 'zod';

/**
 * Códigos de error de la API.
 *
 * El cliente decide qué hacer a partir del código, nunca del texto del mensaje:
 * el mensaje está en español y puede cambiar sin previo aviso.
 */
export const API_ERROR_CODES = [
  'VALIDATION_ERROR',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'SERVICE_UNAVAILABLE',
  'INTERNAL_ERROR',
] as const;
export const apiErrorCodeSchema = z.enum(API_ERROR_CODES);
export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;

/**
 * Forma única de toda respuesta de error del API.
 *
 * `details` queda como `unknown` a propósito: solo lo rellena el error de
 * validación, y el cliente que quiera leerlo tiene que estrecharlo él mismo.
 */
export const apiErrorSchema = z.object({
  error: z.object({
    code: apiErrorCodeSchema,
    message: z.string(),
    details: z.unknown().optional(),
  }),
});
export type ApiErrorBody = z.infer<typeof apiErrorSchema>;

/** Estado que reporta el sistema sobre sí mismo. */
export const healthStatusSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  database: z.enum(['ok', 'unreachable']),
});
export type HealthStatus = z.infer<typeof healthStatusSchema>;
