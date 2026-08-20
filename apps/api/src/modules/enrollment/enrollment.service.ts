import type { Prisma } from '@prisma/client';
import type { Enrollment as EnrollmentDto, EnrollmentDraft, SessionUser } from '@repo/contracts';
import { completeEnrollmentSchema } from '@repo/contracts';
import { ConflictError, NotFoundError, ValidationError } from '../../shared/errors';
import * as catalogService from '../catalog/catalog.service';
import * as receiptService from '../receipt/receipt.service';
import * as enrollmentRepository from './enrollment.repository';
import type { EnrollmentWithRelations } from './enrollment.repository';
import { toEnrollmentDto, pendingSteps } from './enrollment.mapper';
import { applyTransition, isEditable } from './enrollment.transitions';

const NO_EXISTE = 'No encontramos esa inscripción.';

/**
 * Carga una inscripción exigiendo la sesión junto al identificador.
 *
 * La firma es deliberada: no existe forma de pedir una inscripción sin decir
 * quién la pide. Un recurso ajeno sale como inexistente, que es lo que pide la
 * spec —la respuesta no debe distinguir «no es tuya» de «no existe»—.
 *
 * Quién alcanza qué lo decide el repositorio dentro de la consulta, así que
 * añadir el decano no ha requerido ninguna comprobación nueva aquí.
 */
async function loadOwned(id: string, session: SessionUser): Promise<EnrollmentWithRelations> {
  const found = await enrollmentRepository.findByIdOwnedBy(id, {
    id: session.id,
    role: session.role,
  });
  if (!found) throw new NotFoundError(NO_EXISTE);
  return found;
}

async function present(row: EnrollmentWithRelations): Promise<EnrollmentDto> {
  const period = await catalogService.findPeriodById(row.periodId);
  if (!period) throw new NotFoundError(NO_EXISTE);
  const program = row.programId ? await catalogService.findProgramById(row.programId) : null;
  return toEnrollmentDto(row, period, program);
}

/**
 * Inicia la inscripción del periodo abierto, o devuelve la que ya exista.
 *
 * No crea una segunda: la unicidad de aspirante y periodo lo impediría de todas
 * formas, pero devolver la existente es lo que la persona espera.
 */
export async function startOrResume(session: SessionUser): Promise<EnrollmentDto> {
  const period = await catalogService.requireOpenPeriod();

  const existing = await enrollmentRepository.findByUserAndPeriod(session.id, period.id);
  if (existing) return present(existing);

  return present(await enrollmentRepository.create(session.id, period.id));
}

/** La inscripción vigente del aspirante, o null si todavía no ha empezado. */
export async function findCurrent(session: SessionUser): Promise<EnrollmentDto | null> {
  const latest = await enrollmentRepository.findLatestByUser(session.id);
  return latest ? present(latest) : null;
}

export async function findById(id: string, session: SessionUser): Promise<EnrollmentDto> {
  return present(await loadOwned(id, session));
}

/**
 * Guarda datos parciales de la inscripción.
 *
 * Acepta que falten campos —el wizard guarda a medias a propósito— pero no que
 * los que vengan estén mal. El estado no se toca aquí: no es un campo que se
 * pueda escribir desde una petición.
 */
export async function saveDraft(
  id: string,
  session: SessionUser,
  draft: EnrollmentDraft,
): Promise<EnrollmentDto> {
  const enrollment = await loadOwned(id, session);

  if (!isEditable(enrollment.status)) {
    throw new ConflictError('Esta inscripción ya fue enviada y no se puede modificar.');
  }

  if (draft.programId !== undefined) {
    await catalogService.requireActiveProgram(draft.programId);
  }

  const data: Prisma.EnrollmentUpdateInput = {
    ...(draft.firstName === undefined ? {} : { firstName: draft.firstName }),
    ...(draft.lastName === undefined ? {} : { lastName: draft.lastName }),
    ...(draft.birthDate === undefined ? {} : { birthDate: new Date(draft.birthDate) }),
    ...(draft.sex === undefined ? {} : { sex: draft.sex }),
    ...(draft.phone === undefined ? {} : { phone: draft.phone }),
    ...(draft.city === undefined ? {} : { city: draft.city }),
    ...(draft.department === undefined ? {} : { department: draft.department }),
    ...(draft.shift === undefined ? {} : { shift: draft.shift }),
    ...(draft.modality === undefined ? {} : { modality: draft.modality }),
    ...(draft.programId === undefined
      ? {}
      : { program: { connect: { id: draft.programId } } }),
  };

  return present(await enrollmentRepository.updateData(id, data));
}

/**
 * Envía la inscripción y emite su recibo.
 *
 * Comprueba en este orden: que la transición sea legal, que el periodo siga
 * abierto, y que no falte nada. El orden importa para el mensaje: a quien
 * reenvía algo ya enviado hay que decírselo, no listarle campos.
 */
export async function submit(id: string, session: SessionUser): Promise<EnrollmentDto> {
  const enrollment = await loadOwned(id, session);
  const nextStatus = applyTransition(enrollment.status, 'submit', session.role);

  if (!(await catalogService.isPeriodOpen(enrollment.periodId))) {
    throw new ConflictError(
      'El periodo de inscripciones cerró. Lo que diligenciaste se conserva.',
    );
  }

  const pending = pendingSteps(enrollment);
  if (pending.length > 0) {
    const parsed = completeEnrollmentSchema.safeParse(
      (await present(enrollment)).data as Record<string, unknown>,
    );
    const details: Record<string, string> = { pasosPendientes: pending.join(', ') };
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        details[issue.path.map(String).join('.')] ??= issue.message;
      }
    }
    throw new ValidationError('Falta información para poder enviar tu inscripción.', details);
  }

  const submitted = await enrollmentRepository.updateStatus(id, nextStatus, {
    submittedAt: new Date(),
    // Un reenvío tras corregir deja de mostrar el motivo anterior como vigente.
    rejectionReason: null,
  });

  // Reenviar conserva el recibo original: emitir otro cambiaría el número que
  // el aspirante ya pudo haber llevado al banco.
  if (!submitted.receipt) {
    await receiptService.issueFor(submitted.id, submitted.periodId);
  }

  return present(await loadOwned(id, session));
}

/** Devuelve una inscripción rechazada a estado editable. */
export async function reopen(id: string, session: SessionUser): Promise<EnrollmentDto> {
  const enrollment = await loadOwned(id, session);
  const nextStatus = applyTransition(enrollment.status, 'reopen', session.role);
  return present(await enrollmentRepository.updateStatus(id, nextStatus));
}

/** Carga interna para otros módulos del mismo change, con la pertenencia ya aplicada. */
export async function loadOwnedRow(
  id: string,
  session: SessionUser,
): Promise<EnrollmentWithRelations> {
  return loadOwned(id, session);
}
