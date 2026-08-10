import { z } from 'zod';

/**
 * Roles del sistema.
 *
 * El rol define permisos y nada más. El avance del proceso de inscripción vive
 * en `EnrollmentStatus`, y los dos nunca se fusionan: un usuario llega a STUDENT
 * únicamente como efecto de que su inscripción sea aprobada.
 */
export const ROLES = ['APPLICANT', 'STUDENT', 'ADMIN'] as const;
export const roleSchema = z.enum(ROLES);
export type Role = z.infer<typeof roleSchema>;

/** Tipos de documento de identidad aceptados. */
export const DOCUMENT_TYPES = ['CC', 'TI', 'CE', 'PA', 'PEP'] as const;
export const documentTypeSchema = z.enum(DOCUMENT_TYPES);
export type DocumentType = z.infer<typeof documentTypeSchema>;

/** Etiquetas en español para mostrar en la interfaz. */
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  CC: 'Cédula de ciudadanía',
  TI: 'Tarjeta de identidad',
  CE: 'Cédula de extranjería',
  PA: 'Pasaporte',
  PEP: 'Permiso especial de permanencia',
};

/**
 * Avance de la inscripción.
 *
 * Un rechazo no es terminal: devuelve la inscripción a DRAFT para que el
 * aspirante corrija y la reenvíe.
 */
export const ENROLLMENT_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
] as const;
export const enrollmentStatusSchema = z.enum(ENROLLMENT_STATUSES);
export type EnrollmentStatus = z.infer<typeof enrollmentStatusSchema>;

/** Eje de pago, independiente del avance de la inscripción. */
export const PAYMENT_STATUSES = ['PENDING', 'VERIFIED'] as const;
export const paymentStatusSchema = z.enum(PAYMENT_STATUSES);
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;
