import type { Prisma, Enrollment, EnrollmentAttachment, PaymentReceipt } from '@prisma/client';
import type { EnrollmentStatus } from '@repo/contracts';
import { prisma } from '../../shared/database/prisma';

export type EnrollmentWithRelations = Enrollment & {
  attachments: EnrollmentAttachment[];
  receipt: PaymentReceipt | null;
};

const withRelations = { attachments: true, receipt: true } as const;

/**
 * Filtro de pertenencia.
 *
 * Un ADMIN ve cualquiera; el resto, solo lo suyo. Es el **único** sitio del
 * módulo donde se decide eso, y va dentro de la cláusula de la consulta: un
 * recurso ajeno no llega a leerse y sale como inexistente, sin depender de que
 * alguien recuerde comparar después.
 */
function ownershipWhere(ownerId: string, isAdmin: boolean): Prisma.EnrollmentWhereInput {
  return isAdmin ? {} : { userId: ownerId };
}

export async function findByIdOwnedBy(
  id: string,
  ownerId: string,
  isAdmin: boolean,
): Promise<EnrollmentWithRelations | null> {
  return prisma.enrollment.findFirst({
    where: { id, ...ownershipWhere(ownerId, isAdmin) },
    include: withRelations,
  });
}

export async function findByUserAndPeriod(
  userId: string,
  periodId: string,
): Promise<EnrollmentWithRelations | null> {
  return prisma.enrollment.findUnique({
    where: { userId_periodId: { userId, periodId } },
    include: withRelations,
  });
}

/** La más reciente de un aspirante, para saber a qué llevarlo al entrar. */
export async function findLatestByUser(userId: string): Promise<EnrollmentWithRelations | null> {
  return prisma.enrollment.findFirst({
    where: { userId },
    include: withRelations,
    orderBy: { createdAt: 'desc' },
  });
}

export async function create(userId: string, periodId: string): Promise<EnrollmentWithRelations> {
  return prisma.enrollment.create({
    data: { userId, periodId },
    include: withRelations,
  });
}

export async function updateData(
  id: string,
  data: Prisma.EnrollmentUpdateInput,
): Promise<EnrollmentWithRelations> {
  return prisma.enrollment.update({ where: { id }, data, include: withRelations });
}

export async function updateStatus(
  id: string,
  status: EnrollmentStatus,
  extra: Prisma.EnrollmentUpdateInput = {},
): Promise<EnrollmentWithRelations> {
  return prisma.enrollment.update({
    where: { id },
    data: { status, ...extra },
    include: withRelations,
  });
}
