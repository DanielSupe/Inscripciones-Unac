import {
  PAGE_SIZE,
  isReceiptOverdue,
  type Enrollment as EnrollmentDto,
  type Paged,
  type ReviewItem,
  type ReviewQuery,
  type SessionUser,
} from '@repo/contracts';
import { ConflictError, ForbiddenError } from '../../shared/errors';
import * as catalogService from '../catalog/catalog.service';
import * as enrollmentRepository from './enrollment.repository';
import type { ReviewRow } from './enrollment.repository';
import * as enrollmentService from './enrollment.service';
import { pendingSteps } from './enrollment.mapper';
import { applyTransition } from './enrollment.transitions';

function toReviewItem(row: ReviewRow): ReviewItem {
  const nombre = `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim();
  const vigente = row.interviews.find((i) => i.outcome === null) ?? null;

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
    facultyName: row.program?.faculty.name ?? null,
    periodCode: row.period.code,
    submittedAt: row.submittedAt?.toISOString() ?? null,
    paymentStatus: row.receipt?.status ?? null,
    paymentOverdue: row.receipt
      ? isReceiptOverdue(row.receipt.status, row.receipt.dueAt)
      : false,
    interviewAt: vigente?.scheduledAt.toISOString() ?? null,
  };
}

/** Bandeja del administrador: todo el proceso, incluida la parte que ya entregó. */
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
 * Bandeja del decano: solo su facultad, y solo lo ya entregado.
 *
 * El alcance sale de la sesión y entra en la consulta. Nada que llegue en la
 * petición puede ampliarlo.
 */
export async function listForDean(
  query: ReviewQuery,
  session: SessionUser,
): Promise<Paged<ReviewItem>> {
  const { items, total } = await enrollmentRepository.listForReview({
    page: query.page,
    pageSize: PAGE_SIZE,
    status: query.status,
    periodId: query.periodId,
    search: query.search,
    deanUserId: session.id,
  });

  return { items: items.map(toReviewItem), total, page: query.page, pageSize: PAGE_SIZE };
}

/**
 * Detalle de una inscripción alcanzable por quien la pide.
 *
 * Pasa por el mismo camino que usa el aspirante para ver la suya. Que el ADMIN
 * llegue a todas y el DEAN solo a las de su facultad lo resuelve el filtro de
 * visibilidad del repositorio; aquí no hay ninguna excepción añadida.
 */
export async function getDetail(id: string, session: SessionUser): Promise<EnrollmentDto> {
  return enrollmentService.findById(id, session);
}

/** Toma la inscripción para revisión y la deja a nombre de quien la tomó. */
export async function takeForReview(id: string, session: SessionUser): Promise<EnrollmentDto> {
  const enrollment = await enrollmentService.loadOwnedRow(id, session);
  const next = applyTransition(enrollment.status, 'takeForReview', session.role);

  await enrollmentRepository.updateStatus(id, next, {
    reviewedAt: new Date(),
    reviewer: { connect: { id: session.id } },
  });

  return enrollmentService.findById(id, session);
}

/**
 * Entrega la inscripción al decano de la facultad de su programa.
 *
 * El destino se deriva del programa elegido; no se acepta de la petición. Y si
 * esa facultad no tiene decano, se rechaza explicando la causa en vez de dejar
 * la inscripción en un limbo donde nadie la ve.
 */
export async function handOver(id: string, session: SessionUser): Promise<EnrollmentDto> {
  const enrollment = await enrollmentService.loadOwnedRow(id, session);
  const next = applyTransition(enrollment.status, 'handOver', session.role);

  const pendientes = pendingSteps(enrollment);
  if (pendientes.length > 0) {
    throw new ConflictError(
      'No se puede entregar: la inscripción está incompleta y le faltan documentos o datos.',
    );
  }

  if (enrollment.receipt?.status !== 'VERIFIED') {
    throw new ConflictError('No se puede entregar hasta que el pago del recibo conste verificado.');
  }

  // `programId` no puede ser nulo si los pasos están completos, pero el tipo lo
  // admite y adivinarlo con un `as` sería taparle la boca al compilador.
  if (!enrollment.programId) {
    throw new ConflictError('La inscripción no tiene programa elegido.');
  }

  const dean = await catalogService.findDeanOfProgram(enrollment.programId);
  if (!dean) {
    throw new ConflictError(
      'La facultad de ese programa no tiene decano asignado, así que nadie podría revisarla.',
    );
  }

  await enrollmentRepository.updateStatus(id, next, {
    reviewedAt: new Date(),
    reviewer: { connect: { id: session.id } },
  });

  return enrollmentService.findById(id, session);
}

/**
 * Aprueba y promueve.
 *
 * La transición se valida aquí —para dar el mensaje correcto si el estado o el
 * rol no lo admiten— y la escritura ocurre en la transacción del repositorio,
 * que además comprueba dentro el pago y la entrevista.
 */
export async function approve(id: string, session: SessionUser): Promise<EnrollmentDto> {
  const enrollment = await enrollmentService.loadOwnedRow(id, session);
  applyTransition(enrollment.status, 'approve', session.role);

  const result = await enrollmentRepository.approveAndPromote(id, session.id);
  if (!result.ok) {
    throw new ConflictError(
      result.reason === 'sin-pago-verificado'
        ? 'No se puede aprobar hasta que el pago del recibo conste verificado.'
        : 'No se puede aprobar hasta que la entrevista conste realizada.',
    );
  }

  return enrollmentService.findById(id, session);
}

/**
 * Rechaza con motivo.
 *
 * Son dos acciones distintas según quién rechaza, y por eso la transición se
 * elige por el rol de la sesión: el administrador rechaza por trámite mientras
 * la tiene en revisión, y el decano por criterio una vez la inscripción está en
 * su facultad. El guardián comprueba después que ese rol y ese estado encajen.
 */
export async function reject(
  id: string,
  session: SessionUser,
  reason: string,
): Promise<EnrollmentDto> {
  const enrollment = await enrollmentService.loadOwnedRow(id, session);

  if (session.role !== 'ADMIN' && session.role !== 'DEAN') {
    throw new ForbiddenError('No tienes permiso para hacer esto sobre esta inscripción.');
  }

  const action = session.role === 'ADMIN' ? 'rejectByAdmin' : 'rejectByDean';
  const next = applyTransition(enrollment.status, action, session.role);

  const autoria =
    session.role === 'ADMIN'
      ? { reviewedAt: new Date(), reviewer: { connect: { id: session.id } } }
      : { decidedAt: new Date(), decider: { connect: { id: session.id } } };

  await enrollmentRepository.updateStatus(id, next, {
    ...autoria,
    rejectionReason: reason,
  });

  return enrollmentService.findById(id, session);
}
