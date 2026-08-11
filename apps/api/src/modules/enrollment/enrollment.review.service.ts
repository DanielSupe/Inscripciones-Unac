import {
  PAGE_SIZE,
  isReceiptOverdue,
  type Enrollment as EnrollmentDto,
  type Paged,
  type ReviewItem,
  type ReviewQuery,
  type SessionUser,
} from '@repo/contracts';
import { ConflictError } from '../../shared/errors';
import * as enrollmentRepository from './enrollment.repository';
import type { ReviewRow } from './enrollment.repository';
import * as enrollmentService from './enrollment.service';
import { applyTransition } from './enrollment.transitions';

function toReviewItem(row: ReviewRow): ReviewItem {
  const nombre = `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim();

  return {
    id: row.id,
    status: row.status,
    applicantName: nombre.length > 0 ? nombre : 'Sin diligenciar',
    applicantDocument: `${row.user.documentType} ${row.user.documentNumber}`,
    applicantEmail: row.user.email,
    // La cuenta se elimina de forma lógica y su inscripción sobrevive. Quien
    // revisa necesita saberlo, así que se muestra en vez de ocultarse.
    applicantDeleted: row.user.deletedAt !== null,
    programName: row.program?.name ?? null,
    periodCode: row.period.code,
    submittedAt: row.submittedAt?.toISOString() ?? null,
    paymentStatus: row.receipt?.status ?? null,
    paymentOverdue: row.receipt
      ? isReceiptOverdue(row.receipt.status, row.receipt.dueAt)
      : false,
  };
}

export async function listForReview(query: ReviewQuery): Promise<Paged<ReviewItem>> {
  const { items, total } = await enrollmentRepository.listForReview({
    page: query.page,
    pageSize: PAGE_SIZE,
    status: query.status,
    periodId: query.periodId,
    search: query.search,
  });

  return { items: items.map(toReviewItem), total, page: query.page, pageSize: PAGE_SIZE };
}

/**
 * Detalle de cualquier inscripción.
 *
 * Pasa por el mismo camino que usa el aspirante para ver la suya. La excepción
 * de ADMIN vive dentro del filtro de pertenencia del repositorio y es la
 * primera vez que se ejercita en positivo; no se añade ninguna excepción nueva
 * aquí.
 */
export async function getDetail(id: string, session: SessionUser): Promise<EnrollmentDto> {
  return enrollmentService.findById(id, session);
}

/** Toma la inscripción para revisión y la deja a nombre de quien la tomó. */
export async function takeForReview(id: string, session: SessionUser): Promise<EnrollmentDto> {
  const enrollment = await enrollmentService.loadOwnedRow(id, session);
  const next = applyTransition(enrollment.status, 'takeForReview');

  await enrollmentRepository.updateStatus(id, next, {
    reviewedAt: new Date(),
    reviewer: { connect: { id: session.id } },
  });

  return enrollmentService.findById(id, session);
}

/**
 * Aprueba y promueve.
 *
 * La transición se valida aquí —para dar el mensaje correcto si el estado no lo
 * admite— y la escritura ocurre en la transacción del repositorio, que además
 * comprueba el pago dentro.
 */
export async function approve(id: string, session: SessionUser): Promise<EnrollmentDto> {
  const enrollment = await enrollmentService.loadOwnedRow(id, session);
  applyTransition(enrollment.status, 'approve');

  const result = await enrollmentRepository.approveAndPromote(id, session.id);
  if (!result.ok) {
    throw new ConflictError(
      'No se puede aprobar hasta que el pago del recibo conste verificado.',
    );
  }

  return enrollmentService.findById(id, session);
}

/** Rechaza con motivo. El esquema ya garantiza que el motivo no venga vacío. */
export async function reject(
  id: string,
  session: SessionUser,
  reason: string,
): Promise<EnrollmentDto> {
  const enrollment = await enrollmentService.loadOwnedRow(id, session);
  const next = applyTransition(enrollment.status, 'reject');

  await enrollmentRepository.updateStatus(id, next, {
    reviewedAt: new Date(),
    reviewer: { connect: { id: session.id } },
    rejectionReason: reason,
  });

  return enrollmentService.findById(id, session);
}
