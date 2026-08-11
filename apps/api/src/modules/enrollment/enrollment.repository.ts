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

export type ReviewRow = Enrollment & {
  attachments: EnrollmentAttachment[];
  receipt: PaymentReceipt | null;
  user: { documentType: string; documentNumber: string; email: string; deletedAt: Date | null };
  program: { name: string } | null;
  period: { code: string };
};

export interface ReviewListOptions {
  page: number;
  pageSize: number;
  status?: EnrollmentStatus | undefined;
  periodId?: string | undefined;
  search?: string | undefined;
}

/**
 * Bandeja de revisión.
 *
 * Deja fuera por defecto las inscripciones en borrador: todavía no se ha pedido
 * nada sobre ellas, y llenar la bandeja de formularios a medio llenar haría
 * inútil la bandeja.
 */
export async function listForReview(
  options: ReviewListOptions,
): Promise<{ items: ReviewRow[]; total: number }> {
  const search = options.search?.trim();

  const where: Prisma.EnrollmentWhereInput = {
    ...(options.status ? { status: options.status } : { status: { not: 'DRAFT' } }),
    ...(options.periodId ? { periodId: options.periodId } : {}),
    ...(search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { user: { documentNumber: { contains: search, mode: 'insensitive' } } },
            { user: { email: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  const include = {
    attachments: true,
    receipt: true,
    user: {
      select: { documentType: true, documentNumber: true, email: true, deletedAt: true },
    },
    program: { select: { name: true } },
    period: { select: { code: true } },
  } as const;

  const [items, total] = await Promise.all([
    prisma.enrollment.findMany({
      where,
      include,
      orderBy: { submittedAt: 'asc' },
      skip: (options.page - 1) * options.pageSize,
      take: options.pageSize,
    }),
    prisma.enrollment.count({ where }),
  ]);

  return { items: items as ReviewRow[], total };
}

/**
 * Aprueba la inscripción y promueve a su dueño, en una sola transacción.
 *
 * El pago se comprueba **dentro**: hacerlo antes dejaría una ventana en la que
 * otro administrador podría deshacer la verificación entre la comprobación y la
 * escritura.
 *
 * Y las dos escrituras van juntas porque una inscripción aprobada cuyo dueño
 * sigue siendo aspirante —o un estudiante sin inscripción aprobada— son estados
 * que nadie podría explicar mirando la base de datos.
 */
export async function approveAndPromote(
  id: string,
  reviewerId: string,
): Promise<{ ok: true } | { ok: false; reason: 'sin-pago-verificado' }> {
  return prisma.$transaction(async (tx) => {
    const receipt = await tx.paymentReceipt.findUnique({ where: { enrollmentId: id } });
    if (!receipt || receipt.status !== 'VERIFIED') {
      return { ok: false as const, reason: 'sin-pago-verificado' as const };
    }

    const enrollment = await tx.enrollment.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewedByUserId: reviewerId,
        rejectionReason: null,
      },
      select: { userId: true },
    });

    await tx.user.update({ where: { id: enrollment.userId }, data: { role: 'STUDENT' } });

    return { ok: true as const };
  });
}
