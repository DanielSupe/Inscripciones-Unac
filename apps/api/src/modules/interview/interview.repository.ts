import type { Interview, Prisma } from '@prisma/client';
import type { EnrollmentStatus, InterviewOutcome } from '@repo/contracts';
import { prisma } from '../../shared/database/prisma';

export type { Interview };

/** La entrevista en pie de una inscripción: la única sin resultado. */
export async function findOpenByEnrollment(enrollmentId: string): Promise<Interview | null> {
  return prisma.interview.findFirst({ where: { enrollmentId, outcome: null } });
}

export interface ScheduleData {
  scheduledAt: Date;
  modality: 'ON_SITE' | 'VIRTUAL';
  location: string | null;
  meetingUrl: string | null;
}

/**
 * Crea la entrevista y avanza la inscripción, en una sola transacción.
 *
 * Separarlas dejaría una cita en pie sobre una inscripción que sigue diciendo
 * que espera fecha, o al revés. Ninguno de los dos estados se podría explicar.
 *
 * La unicidad de la cita vigente se comprueba **dentro**: entre leer y escribir
 * cabría otra petición del mismo decano.
 */
export async function scheduleAndAdvance(
  enrollmentId: string,
  nextStatus: EnrollmentStatus,
  scheduledByUserId: string,
  data: ScheduleData,
): Promise<{ ok: true; interview: Interview } | { ok: false; reason: 'ya-hay-una-abierta' }> {
  return prisma.$transaction(async (tx) => {
    const abierta = await tx.interview.findFirst({
      where: { enrollmentId, outcome: null },
      select: { id: true },
    });
    if (abierta) return { ok: false as const, reason: 'ya-hay-una-abierta' as const };

    const interview = await tx.interview.create({
      data: { enrollmentId, scheduledByUserId, ...data },
    });

    await tx.enrollment.update({ where: { id: enrollmentId }, data: { status: nextStatus } });

    return { ok: true as const, interview };
  });
}

/** Mueve la cita vigente. El estado de la inscripción no cambia al reagendar. */
export async function reschedule(id: string, data: ScheduleData): Promise<Interview> {
  return prisma.interview.update({ where: { id }, data });
}

/**
 * Cierra la entrevista con su resultado y lleva la inscripción a donde toque.
 *
 * Una inasistencia devuelve a la espera de fecha; una realizada habilita la
 * decisión. Las dos escrituras van juntas por el mismo motivo que al agendar.
 */
export async function closeAndAdvance(
  id: string,
  enrollmentId: string,
  outcome: InterviewOutcome,
  nextStatus: EnrollmentStatus,
): Promise<Interview> {
  return prisma.$transaction(async (tx) => {
    const cerrada = await tx.interview.update({
      where: { id },
      data: { outcome, closedAt: new Date() } satisfies Prisma.InterviewUpdateInput,
    });

    await tx.enrollment.update({ where: { id: enrollmentId }, data: { status: nextStatus } });

    return cerrada;
  });
}
