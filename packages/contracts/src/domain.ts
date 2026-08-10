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

export const SEXES = ['MALE', 'FEMALE', 'OTHER'] as const;
export const sexSchema = z.enum(SEXES);
export type Sex = z.infer<typeof sexSchema>;

export const SEX_LABELS: Record<Sex, string> = {
  MALE: 'Masculino',
  FEMALE: 'Femenino',
  OTHER: 'Otro',
};

/** Jornada en la que se cursa el programa. */
export const SHIFTS = ['DAY', 'NIGHT'] as const;
export const shiftSchema = z.enum(SHIFTS);
export type Shift = z.infer<typeof shiftSchema>;

export const SHIFT_LABELS: Record<Shift, string> = {
  DAY: 'Diurna',
  NIGHT: 'Nocturna',
};

export const MODALITIES = ['ON_SITE', 'DISTANCE'] as const;
export const modalitySchema = z.enum(MODALITIES);
export type Modality = z.infer<typeof modalitySchema>;

export const MODALITY_LABELS: Record<Modality, string> = {
  ON_SITE: 'Presencial',
  DISTANCE: 'A distancia',
};

/** Documentos que el aspirante debe adjuntar para poder enviar su inscripción. */
export const ATTACHMENT_TYPES = ['IDENTITY', 'ICFES'] as const;
export const attachmentTypeSchema = z.enum(ATTACHMENT_TYPES);
export type AttachmentType = z.infer<typeof attachmentTypeSchema>;

export const ATTACHMENT_TYPE_LABELS: Record<AttachmentType, string> = {
  IDENTITY: 'Documento de identidad',
  ICFES: 'Resultados ICFES (Saber 11)',
};

/** Tipos de archivo admitidos al adjuntar. Se comprueban antes de firmar la subida. */
export const ALLOWED_ATTACHMENT_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const;
export const attachmentMimeTypeSchema = z.enum(ALLOWED_ATTACHMENT_MIME_TYPES);
export type AttachmentMimeType = z.infer<typeof attachmentMimeTypeSchema>;
