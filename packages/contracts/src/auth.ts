import { z } from 'zod';
import { documentTypeSchema, roleSchema } from './domain';

/** Mínimo de caracteres de una contraseña. Compartido para que el frontend avise antes. */
export const PASSWORD_MIN_LENGTH = 8;

const documentNumberSchema = z
  .string()
  .trim()
  .min(5, { message: 'Debe tener al menos 5 caracteres' })
  .max(20, { message: 'Debe tener como mucho 20 caracteres' })
  .regex(/^[0-9A-Za-z-]+$/, { message: 'Solo admite letras, números y guiones' });

const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, { message: `Debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres` })
  .max(72, { message: 'Debe tener como mucho 72 caracteres' });

/**
 * Registro de una cuenta de aspirante.
 *
 * Lista exactamente los campos admitidos: cualquier otro que llegue en la
 * petición se descarta. Así `role` o `isSystem` no alcanzan la capa de datos y
 * el registro no puede otorgar privilegios, por construcción y no por acordarse
 * de filtrar.
 *
 * La confirmación del correo se valida aquí para que frontend y backend
 * apliquen la misma regla; no se almacena.
 */
export const registerRequestSchema = z
  .object({
    documentType: documentTypeSchema,
    documentNumber: documentNumberSchema,
    email: z.email({ message: 'Escribe un correo válido' }).trim().toLowerCase(),
    emailConfirmation: z.email({ message: 'Escribe un correo válido' }).trim().toLowerCase(),
    password: passwordSchema,
    acceptedPolicies: z.literal(true, {
      message: 'Debes aceptar las políticas de tratamiento de datos',
    }),
  })
  .refine((data) => data.email === data.emailConfirmation, {
    message: 'Los dos correos no coinciden',
    path: ['emailConfirmation'],
  });
export type RegisterRequest = z.infer<typeof registerRequestSchema>;

/** Ingreso. La credencial es el correo, no el documento. */
export const loginRequestSchema = z.object({
  email: z.email({ message: 'Escribe un correo válido' }).trim().toLowerCase(),
  password: z.string().min(1, { message: 'Escribe tu contraseña' }),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

/**
 * Identidad de quien tiene la sesión abierta.
 *
 * Es la única fuente de verdad sobre el rol: el frontend decide qué mostrar a
 * partir de esto y nunca a partir de algo que él mismo guarde.
 */
export const sessionUserSchema = z.object({
  id: z.string(),
  documentType: documentTypeSchema,
  documentNumber: z.string(),
  email: z.email(),
  role: roleSchema,
});
export type SessionUser = z.infer<typeof sessionUserSchema>;
