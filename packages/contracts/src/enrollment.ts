import { z } from 'zod';
import {
  attachmentMimeTypeSchema,
  attachmentTypeSchema,
  enrollmentStatusSchema,
  modalitySchema,
  paymentStatusSchema,
  sexSchema,
  shiftSchema,
} from './domain';

/**
 * Fecha en formato de calendario, tal como la envía un campo de tipo `date`.
 *
 * Se valida que exista de verdad: `2026-02-31` cumple el patrón y no es un día.
 */
const calendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Usa el formato AAAA-MM-DD' })
  .refine((value) => !Number.isNaN(Date.parse(value)), { message: 'Esa fecha no existe' });

const CURRENT_YEAR = new Date().getFullYear();

// ─── Paso 1 · Datos personales ───────────────────────────────────────────────

export const personalStepSchema = z.object({
  firstName: z.string().trim().min(2, { message: 'Escribe tus nombres' }).max(80),
  lastName: z.string().trim().min(2, { message: 'Escribe tus apellidos' }).max(80),
  birthDate: calendarDateSchema.refine(
    (value) => {
      const age = (Date.now() - Date.parse(value)) / (365.25 * 24 * 60 * 60 * 1000);
      return age >= 14 && age <= 100;
    },
    { message: 'La fecha de nacimiento no parece correcta' },
  ),
  sex: sexSchema,
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]{7,20}$/, { message: 'Escribe un teléfono válido' }),
  city: z.string().trim().min(2, { message: 'Escribe tu ciudad' }).max(80),
  department: z.string().trim().min(2, { message: 'Escribe tu departamento' }).max(80),
});
export type PersonalStep = z.infer<typeof personalStepSchema>;

// ─── Paso 2 · Datos académicos previos ───────────────────────────────────────

export const academicStepSchema = z.object({
  previousSchool: z.string().trim().min(3, { message: 'Escribe el nombre de tu colegio' }).max(120),
  graduationYear: z.coerce
    .number({ message: 'Escribe el año en que te graduaste' })
    .int({ message: 'Escribe un año válido' })
    .min(1950, { message: 'Escribe un año válido' })
    .max(CURRENT_YEAR, { message: 'El año de graduación no puede estar en el futuro' }),
  icfesRegistration: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{6,20}$/, { message: 'El registro ICFES solo lleva letras y números' }),
  // El puntaje global de la prueba Saber 11 va de 0 a 500.
  icfesScore: z.coerce
    .number({ message: 'Escribe tu puntaje global' })
    .int({ message: 'El puntaje es un número entero' })
    .min(0, { message: 'El puntaje va de 0 a 500' })
    .max(500, { message: 'El puntaje va de 0 a 500' }),
});
export type AcademicStep = z.infer<typeof academicStepSchema>;

// ─── Paso 3 · Aspiración ─────────────────────────────────────────────────────

export const aspirationStepSchema = z.object({
  programId: z.string().min(1, { message: 'Elige un programa' }),
  shift: shiftSchema,
  modality: modalitySchema,
});
export type AspirationStep = z.infer<typeof aspirationStepSchema>;

// ─── Guardado por pasos ──────────────────────────────────────────────────────

/**
 * Lo que acepta el guardado de un paso.
 *
 * Todos los campos son opcionales porque el wizard guarda a medias a propósito,
 * pero los que vengan se validan igual: un dato con formato inválido no se
 * guarda, aunque el paso esté incompleto.
 *
 * El periodo no aparece: lo fija el servidor con el que esté abierto. Y el
 * estado tampoco, porque no es un campo escribible desde una petición.
 */
export const enrollmentDraftSchema = personalStepSchema
  .partial()
  .extend(academicStepSchema.partial().shape)
  .extend(aspirationStepSchema.partial().shape);
export type EnrollmentDraft = z.infer<typeof enrollmentDraftSchema>;

/**
 * Lo que exige la transición de envío.
 *
 * Es el mismo conjunto sin nada opcional, así que sus errores son exactamente
 * la lista de lo que le falta al aspirante para poder enviar.
 */
export const completeEnrollmentSchema = personalStepSchema
  .extend(academicStepSchema.shape)
  .extend(aspirationStepSchema.shape);
export type CompleteEnrollment = z.infer<typeof completeEnrollmentSchema>;

/** Los pasos, en orden, para que el wizard sepa a cuál llevar al retomar. */
export const ENROLLMENT_STEPS = ['personal', 'academic', 'aspiration', 'documents'] as const;
export const enrollmentStepSchema = z.enum(ENROLLMENT_STEPS);
export type EnrollmentStep = z.infer<typeof enrollmentStepSchema>;

export const ENROLLMENT_STEP_LABELS: Record<EnrollmentStep, string> = {
  personal: 'Datos personales',
  academic: 'Datos académicos',
  aspiration: 'Aspiración',
  documents: 'Documentos',
};

// ─── Catálogo académico ──────────────────────────────────────────────────────

export const academicProgramSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
});
export type AcademicProgram = z.infer<typeof academicProgramSchema>;

export const academicPeriodSchema = z.object({
  id: z.string(),
  code: z.string(),
  opensAt: z.string(),
  closesAt: z.string(),
  enrollmentFeeAmount: z.number(),
  currency: z.string(),
});
export type AcademicPeriod = z.infer<typeof academicPeriodSchema>;

/** Lo que el frontend necesita para decidir si puede ofrecer el formulario. */
export const catalogSchema = z.object({
  programs: z.array(academicProgramSchema),
  openPeriod: academicPeriodSchema.nullable(),
});
export type Catalog = z.infer<typeof catalogSchema>;

// ─── Documentos adjuntos ─────────────────────────────────────────────────────

export const attachmentSchema = z.object({
  type: attachmentTypeSchema,
  contentType: z.string(),
  sizeBytes: z.number(),
  uploadedAt: z.string(),
});
export type Attachment = z.infer<typeof attachmentSchema>;

/** Petición de permiso de subida. El servidor compone la clave; el cliente no la propone. */
export const uploadTicketRequestSchema = z.object({
  type: attachmentTypeSchema,
  contentType: attachmentMimeTypeSchema,
  sizeBytes: z.number().int().positive(),
});
export type UploadTicketRequest = z.infer<typeof uploadTicketRequestSchema>;

export const uploadTicketSchema = z.object({
  url: z.url(),
  expiresInSeconds: z.number(),
});
export type UploadTicket = z.infer<typeof uploadTicketSchema>;

// ─── Recibo de pago ──────────────────────────────────────────────────────────

export const receiptSchema = z.object({
  receiptNumber: z.string(),
  amount: z.number(),
  currency: z.string(),
  issuedAt: z.string(),
  dueAt: z.string(),
  status: paymentStatusSchema,
});
export type Receipt = z.infer<typeof receiptSchema>;

// ─── La inscripción tal como la ve su dueño ──────────────────────────────────

export const enrollmentSchema = z.object({
  id: z.string(),
  status: enrollmentStatusSchema,
  program: academicProgramSchema.nullable(),
  period: academicPeriodSchema,
  data: enrollmentDraftSchema,
  attachments: z.array(attachmentSchema),
  /** Pasos que todavía no están completos. Vacío significa que se puede enviar. */
  pendingSteps: z.array(enrollmentStepSchema),
  submittedAt: z.string().nullable(),
  rejectionReason: z.string().nullable(),
  receipt: receiptSchema.nullable(),
});
export type Enrollment = z.infer<typeof enrollmentSchema>;
