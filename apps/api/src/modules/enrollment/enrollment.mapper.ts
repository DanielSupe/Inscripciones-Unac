import type {
  Attachment,
  Enrollment as EnrollmentDto,
  EnrollmentDraft,
  EnrollmentStep,
  Receipt,
} from '@repo/contracts';
import { ATTACHMENT_TYPES, completeEnrollmentSchema, isReceiptOverdue } from '@repo/contracts';
import type { EnrollmentWithRelations } from './enrollment.repository';
import type { AcademicPeriod, AcademicProgram } from '../catalog/catalog.repository';
import { toPeriod, toProgram } from '../catalog/catalog.service';

/** Los datos diligenciados, tal como los espera el formulario. */
export function toDraft(row: EnrollmentWithRelations): EnrollmentDraft {
  return {
    ...(row.firstName === null ? {} : { firstName: row.firstName }),
    ...(row.lastName === null ? {} : { lastName: row.lastName }),
    ...(row.birthDate === null
      ? {}
      : { birthDate: row.birthDate.toISOString().slice(0, 10) }),
    ...(row.sex === null ? {} : { sex: row.sex }),
    ...(row.phone === null ? {} : { phone: row.phone }),
    ...(row.city === null ? {} : { city: row.city }),
    ...(row.department === null ? {} : { department: row.department }),

    ...(row.programId === null ? {} : { programId: row.programId }),
    ...(row.shift === null ? {} : { shift: row.shift }),
    ...(row.modality === null ? {} : { modality: row.modality }),
  };
}

/**
 * Qué pasos le faltan al aspirante para poder enviar.
 *
 * Se calcula con el mismo esquema que exige la transición de envío, así que la
 * lista que ve en pantalla y el motivo por el que el envío se rechazaría son
 * exactamente lo mismo, y no dos reglas que puedan separarse con el tiempo.
 */
export function pendingSteps(row: EnrollmentWithRelations): EnrollmentStep[] {
  const parsed = completeEnrollmentSchema.safeParse(toDraft(row));
  const pending = new Set<EnrollmentStep>();

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0]);
      if (['firstName', 'lastName', 'birthDate', 'sex', 'phone', 'city', 'department'].includes(field)) {
        pending.add('personal');
      } else if (['programId', 'shift', 'modality'].includes(field)) {
        pending.add('aspiration');
      }
    }
  }

  const adjuntos = new Set(row.attachments.map((a) => a.type));
  if (ATTACHMENT_TYPES.some((tipo) => !adjuntos.has(tipo))) {
    pending.add('documents');
  }

  // Se devuelven en el orden del wizard, para poder llevar al primero pendiente.
  return (['personal', 'aspiration', 'documents'] as const).filter((step) =>
    pending.has(step),
  );
}

function toAttachment(row: EnrollmentWithRelations['attachments'][number]): Attachment {
  return {
    type: row.type,
    contentType: row.contentType,
    sizeBytes: row.sizeBytes,
    uploadedAt: row.uploadedAt.toISOString(),
  };
}

function toReceipt(row: NonNullable<EnrollmentWithRelations['receipt']>): Receipt {
  return {
    receiptNumber: row.receiptNumber,
    amount: Number(row.amount),
    currency: row.currency,
    issuedAt: row.issuedAt.toISOString(),
    dueAt: row.dueAt.toISOString(),
    status: row.status,
    // Se calcula al presentarlo; no hay columna que mantener al día.
    isOverdue: isReceiptOverdue(row.status, row.dueAt),
  };
}

export function toEnrollmentDto(
  row: EnrollmentWithRelations,
  period: AcademicPeriod,
  program: AcademicProgram | null,
): EnrollmentDto {
  return {
    id: row.id,
    status: row.status,
    program: program ? toProgram(program) : null,
    period: toPeriod(period),
    data: toDraft(row),
    attachments: row.attachments.map(toAttachment),
    pendingSteps: pendingSteps(row),
    submittedAt: row.submittedAt?.toISOString() ?? null,
    rejectionReason: row.rejectionReason,
    receipt: row.receipt ? toReceipt(row.receipt) : null,
  };
}
