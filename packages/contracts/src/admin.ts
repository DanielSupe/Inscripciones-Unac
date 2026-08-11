import { z } from 'zod';
import { documentTypeSchema, enrollmentStatusSchema, roleSchema } from './domain';
import { PASSWORD_MIN_LENGTH } from './auth';

/**
 * Roles que un administrador puede asignar.
 *
 * STUDENT queda fuera a propósito y en el propio esquema: a ese rol solo se
 * llega aprobando una inscripción, así que ni siquiera debe poder pedirse.
 */
export const ASSIGNABLE_ROLES = ['APPLICANT', 'ADMIN'] as const;
export const assignableRoleSchema = z.enum(ASSIGNABLE_ROLES, {
  message: 'A estudiante solo se llega aprobando una inscripción',
});
export type AssignableRole = z.infer<typeof assignableRoleSchema>;

// ─── Listados paginados ──────────────────────────────────────────────────────

export const PAGE_SIZE = 20;

export const pageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  search: z.string().trim().max(120).optional(),
});
export type PageQuery = z.infer<typeof pageQuerySchema>;

/** Forma común de cualquier listado paginado. */
export function pagedSchema<T extends z.ZodType>(item: T) {
  return z.object({
    items: z.array(item),
    total: z.number().int(),
    page: z.number().int(),
    pageSize: z.number().int(),
  });
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ─── Gestión de cuentas ──────────────────────────────────────────────────────

export const userQuerySchema = pageQuerySchema.extend({
  role: roleSchema.optional(),
  includeDeleted: z.coerce.boolean().default(false),
});
export type UserQuery = z.infer<typeof userQuerySchema>;

export const managedUserSchema = z.object({
  id: z.string(),
  documentType: documentTypeSchema,
  documentNumber: z.string(),
  email: z.email(),
  role: roleSchema,
  /** La cuenta de administrador original: ni se elimina ni cambia de rol. */
  isSystem: z.boolean(),
  createdAt: z.string(),
  deletedAt: z.string().nullable(),
});
export type ManagedUser = z.infer<typeof managedUserSchema>;

const documentNumberSchema = z
  .string()
  .trim()
  .min(5, { message: 'Debe tener al menos 5 caracteres' })
  .max(20)
  .regex(/^[0-9A-Za-z-]+$/, { message: 'Solo admite letras, números y guiones' });

export const createUserSchema = z.object({
  documentType: documentTypeSchema,
  documentNumber: documentNumberSchema,
  email: z.email({ message: 'Escribe un correo válido' }).trim().toLowerCase(),
  role: assignableRoleSchema,
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, { message: `Debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres` }),
});
export type CreateUserRequest = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  documentType: documentTypeSchema.optional(),
  documentNumber: documentNumberSchema.optional(),
  email: z.email({ message: 'Escribe un correo válido' }).trim().toLowerCase().optional(),
  role: assignableRoleSchema.optional(),
});
export type UpdateUserRequest = z.infer<typeof updateUserSchema>;

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, { message: `Debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres` }),
});
export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;

// ─── Bandeja de revisión ─────────────────────────────────────────────────────

export const reviewQuerySchema = pageQuerySchema.extend({
  status: enrollmentStatusSchema.optional(),
  periodId: z.string().optional(),
});
export type ReviewQuery = z.infer<typeof reviewQuerySchema>;

export const reviewItemSchema = z.object({
  id: z.string(),
  status: enrollmentStatusSchema,
  applicantName: z.string(),
  applicantDocument: z.string(),
  applicantEmail: z.string(),
  /** El titular fue eliminado: la inscripción sobrevive y hay que poder verlo. */
  applicantDeleted: z.boolean(),
  programName: z.string().nullable(),
  periodCode: z.string(),
  submittedAt: z.string().nullable(),
  paymentStatus: z.enum(['PENDING', 'VERIFIED']).nullable(),
  paymentOverdue: z.boolean(),
});
export type ReviewItem = z.infer<typeof reviewItemSchema>;

/** El motivo es obligatorio: un rechazo sin explicación no le sirve a nadie. */
export const rejectSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(10, { message: 'Explica en al menos 10 caracteres qué debe corregir' })
    .max(500),
});
export type RejectRequest = z.infer<typeof rejectSchema>;

// ─── Periodos académicos ─────────────────────────────────────────────────────

const periodBodySchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{4}-[12]$/, { message: 'Usa el formato AAAA-1 o AAAA-2' }),
  opensAt: z.string().min(1, { message: 'Indica la fecha de apertura' }),
  closesAt: z.string().min(1, { message: 'Indica la fecha de cierre' }),
  enrollmentFeeAmount: z.coerce
    .number({ message: 'Indica el valor del derecho de inscripción' })
    .positive({ message: 'El valor debe ser mayor que 0' }),
  isActive: z.boolean().default(true),
});

/** El cierre después de la apertura: un periodo al revés no admitiría a nadie. */
const closesAfterOpens = {
  check: (data: { opensAt: string; closesAt: string }) =>
    Date.parse(data.closesAt) > Date.parse(data.opensAt),
  message: 'La fecha de cierre debe ser posterior a la de apertura',
  path: ['closesAt'] as const,
};

export const createPeriodSchema = periodBodySchema.refine(closesAfterOpens.check, {
  message: closesAfterOpens.message,
  path: [...closesAfterOpens.path],
});
export type CreatePeriodRequest = z.infer<typeof createPeriodSchema>;

export const updatePeriodSchema = periodBodySchema.omit({ code: true }).refine(
  closesAfterOpens.check,
  { message: closesAfterOpens.message, path: [...closesAfterOpens.path] },
);
export type UpdatePeriodRequest = z.infer<typeof updatePeriodSchema>;

export const managedPeriodSchema = z.object({
  id: z.string(),
  code: z.string(),
  opensAt: z.string(),
  closesAt: z.string(),
  enrollmentFeeAmount: z.number(),
  currency: z.string(),
  isActive: z.boolean(),
  enrollmentCount: z.number().int(),
});
export type ManagedPeriod = z.infer<typeof managedPeriodSchema>;
