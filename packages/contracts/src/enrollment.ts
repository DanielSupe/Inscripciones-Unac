import { z } from 'zod';
import {
  attachmentMimeTypeSchema,
  attachmentTypeSchema,
  enrollmentStatusSchema,
  interviewModalitySchema,
  interviewOutcomeSchema,
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

// ─── Paso 2 · Aspiración ─────────────────────────────────────────────────────

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
  .extend(aspirationStepSchema.partial().shape);
export type EnrollmentDraft = z.infer<typeof enrollmentDraftSchema>;

/**
 * Lo que exige la transición de envío.
 *
 * Es el mismo conjunto sin nada opcional, así que sus errores son exactamente
 * la lista de lo que le falta al aspirante para poder enviar.
 */
export const completeEnrollmentSchema = personalStepSchema.extend(aspirationStepSchema.shape);
export type CompleteEnrollment = z.infer<typeof completeEnrollmentSchema>;

/** Los pasos, en orden, para que el wizard sepa a cuál llevar al retomar. */
export const ENROLLMENT_STEPS = ['personal', 'aspiration', 'documents'] as const;
export const enrollmentStepSchema = z.enum(ENROLLMENT_STEPS);
export type EnrollmentStep = z.infer<typeof enrollmentStepSchema>;

/**
 * Etiquetas de los pasos, escritas desde el lado de quien se inscribe.
 *
 * «Tus datos» y no «Datos personales»: quien llena esto no está clasificando
 * información, está contando quién es.
 */
export const ENROLLMENT_STEP_LABELS: Record<EnrollmentStep, string> = {
  personal: 'Tus datos',
  aspiration: 'Tu programa',
  documents: 'Tus documentos',
};

// ─── Catálogo académico ──────────────────────────────────────────────────────

/**
 * Facultad.
 *
 * Agrupa programas y tiene un decano. Ese vínculo es lo que decide a quién le
 * llega cada inscripción, así que viaja con el programa a todas partes.
 */
export const facultySchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
});
export type Faculty = z.infer<typeof facultySchema>;

export const academicProgramSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  faculty: facultySchema,
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
  /**
   * Si venció sin pagarse.
   *
   * Se calcula al presentarlo, no se almacena: es una función de dos datos que
   * ya existen. Guardarlo como estado obligaría a un proceso que lo mantuviera
   * al día, y ese proceso es justo lo que decidimos no construir.
   */
  isOverdue: z.boolean(),
});
export type Receipt = z.infer<typeof receiptSchema>;

/** Un recibo está vencido si sigue pendiente y su fecha ya pasó. */
export function isReceiptOverdue(
  status: 'PENDING' | 'VERIFIED',
  dueAt: Date | string,
  now: Date = new Date(),
): boolean {
  if (status === 'VERIFIED') return false;
  return new Date(dueAt).getTime() < now.getTime();
}

// ─── Entrevista de admisión ──────────────────────────────────────────────────

export const interviewSchema = z.object({
  id: z.string(),
  scheduledAt: z.string(),
  modality: interviewModalitySchema,
  /** Presente solo si es presencial. */
  location: z.string().nullable(),
  /** Presente solo si es virtual. */
  meetingUrl: z.string().nullable(),
  /** Nulo mientras la cita sigue en pie. Con valor, la entrevista está cerrada. */
  outcome: interviewOutcomeSchema.nullable(),
});
export type Interview = z.infer<typeof interviewSchema>;

/**
 * Petición de agendar o mover una entrevista.
 *
 * La modalidad decide qué dato de acceso es obligatorio. Se comprueba aquí, en
 * el esquema compartido, para que el formulario y el endpoint apliquen la misma
 * regla sin escribirla dos veces.
 */
export const scheduleInterviewSchema = z
  .object({
    scheduledAt: z
      .string()
      .refine((value) => !Number.isNaN(Date.parse(value)), { message: 'Esa fecha no existe' }),
    modality: interviewModalitySchema,
    location: z.string().trim().max(200).optional(),
    meetingUrl: z.string().trim().max(500).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.modality === 'ON_SITE' && !value.location) {
      ctx.addIssue({
        code: 'custom',
        path: ['location'],
        message: 'Indica dónde será la entrevista',
      });
    }
    if (value.modality === 'VIRTUAL' && !value.meetingUrl) {
      ctx.addIssue({
        code: 'custom',
        path: ['meetingUrl'],
        message: 'Indica el enlace de la reunión',
      });
    }
  });
export type ScheduleInterviewRequest = z.infer<typeof scheduleInterviewSchema>;

export const interviewOutcomeRequestSchema = z.object({ outcome: interviewOutcomeSchema });
export type InterviewOutcomeRequest = z.infer<typeof interviewOutcomeRequestSchema>;

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
  /** La cita en pie, si la hay. */
  interview: interviewSchema.nullable(),
  /** Las cerradas, de la más reciente a la más antigua. Ahí constan las ausencias. */
  pastInterviews: z.array(interviewSchema),
  decidedAt: z.string().nullable(),
});
export type Enrollment = z.infer<typeof enrollmentSchema>;
