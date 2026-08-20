import type {
  Enrollment as EnrollmentDto,
  InterviewOutcome,
  ScheduleInterviewRequest,
  SessionUser,
} from '@repo/contracts';
import { ConflictError, NotFoundError, ValidationError } from '../../shared/errors';
import * as enrollmentService from '../enrollment/enrollment.service';
import { applyTransition } from '../enrollment/enrollment.transitions';
import * as interviewRepository from './interview.repository';

/**
 * Una cita a la que ya no se puede llegar no es una cita.
 *
 * Se compara contra el momento de la petición y no contra el día, porque una
 * entrevista a las 8 de la mañana de hoy ya pasó a las 10.
 */
function exigirFutura(scheduledAt: Date): void {
  if (scheduledAt.getTime() <= Date.now()) {
    throw new ValidationError('La fecha de la entrevista tiene que estar en el futuro.', {
      scheduledAt: 'Elige una fecha y hora que todavía no hayan pasado',
    });
  }
}

/** Solo se guarda el dato que corresponde a la modalidad; el otro queda nulo. */
function datosDeAcceso(peticion: ScheduleInterviewRequest): interviewRepository.ScheduleData {
  return {
    scheduledAt: new Date(peticion.scheduledAt),
    modality: peticion.modality,
    location: peticion.modality === 'ON_SITE' ? (peticion.location ?? null) : null,
    meetingUrl: peticion.modality === 'VIRTUAL' ? (peticion.meetingUrl ?? null) : null,
  };
}

export async function schedule(
  enrollmentId: string,
  session: SessionUser,
  peticion: ScheduleInterviewRequest,
): Promise<EnrollmentDto> {
  const enrollment = await enrollmentService.loadOwnedRow(enrollmentId, session);
  const next = applyTransition(enrollment.status, 'schedule', session.role);

  const data = datosDeAcceso(peticion);
  exigirFutura(data.scheduledAt);

  const result = await interviewRepository.scheduleAndAdvance(
    enrollmentId,
    next,
    session.id,
    data,
  );
  if (!result.ok) {
    throw new ConflictError('Esta inscripción ya tiene una entrevista agendada.');
  }

  return enrollmentService.findById(enrollmentId, session);
}

export async function reschedule(
  enrollmentId: string,
  session: SessionUser,
  peticion: ScheduleInterviewRequest,
): Promise<EnrollmentDto> {
  const enrollment = await enrollmentService.loadOwnedRow(enrollmentId, session);
  applyTransition(enrollment.status, 'reschedule', session.role);

  const abierta = await interviewRepository.findOpenByEnrollment(enrollmentId);
  if (!abierta) {
    throw new NotFoundError('No hay ninguna entrevista en pie que mover.');
  }

  const data = datosDeAcceso(peticion);
  exigirFutura(data.scheduledAt);

  await interviewRepository.reschedule(abierta.id, data);
  return enrollmentService.findById(enrollmentId, session);
}

/**
 * Declara cómo terminó la entrevista.
 *
 * Realizada exige que la fecha ya haya pasado: dar por celebrada una cita
 * futura convertiría el registro en una ficción. Una inasistencia sí puede
 * declararse en cuanto pasa la hora, y devuelve la inscripción a la espera para
 * que el decano ponga otra fecha o rechace.
 */
export async function declareOutcome(
  enrollmentId: string,
  session: SessionUser,
  outcome: InterviewOutcome,
): Promise<EnrollmentDto> {
  const enrollment = await enrollmentService.loadOwnedRow(enrollmentId, session);
  const action = outcome === 'HELD' ? 'markHeld' : 'markNoShow';
  const next = applyTransition(enrollment.status, action, session.role);

  const abierta = await interviewRepository.findOpenByEnrollment(enrollmentId);
  if (!abierta) {
    throw new ConflictError('Esta entrevista ya tiene un resultado registrado.');
  }

  if (abierta.scheduledAt.getTime() > Date.now()) {
    throw new ConflictError('Esa entrevista todavía no ha ocurrido.');
  }

  await interviewRepository.closeAndAdvance(abierta.id, enrollmentId, outcome, next);
  return enrollmentService.findById(enrollmentId, session);
}
