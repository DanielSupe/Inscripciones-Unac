import type {
  Prisma,
  Enrollment,
  EnrollmentAttachment,
  Interview,
  PaymentReceipt,
} from '@prisma/client';
import type { EnrollmentStatus, Role } from '@repo/contracts';
import { prisma } from '../../shared/database/prisma';

export type EnrollmentWithRelations = Enrollment & {
  attachments: EnrollmentAttachment[];
  receipt: PaymentReceipt | null;
  interviews: Interview[];
};

const withRelations = {
  attachments: true,
  receipt: true,
  // De la más reciente a la más antigua: la vigente, si la hay, va primero.
  interviews: { orderBy: { createdAt: 'desc' } },
} as const;

/** Quién mira. Sale siempre de la sesión del servidor. */
export interface Viewer {
  id: string;
  role: Role;
}

/**
 * Filtro de visibilidad.
 *
 * Un ADMIN ve cualquiera, un DEAN las de su facultad, y el resto solo lo suyo.
 * Es el **único** sitio del módulo donde se decide eso, y va dentro de la
 * cláusula de la consulta: un recurso ajeno no llega a leerse y sale como
 * inexistente, sin depender de que alguien recuerde comparar después.
 *
 * La facultad del decano se deduce del programa elegido y no de un campo
 * guardado en la inscripción: duplicarlo abriría la puerta a que quedaran en
 * desacuerdo.
 */
function visibilityWhere(viewer: Viewer): Prisma.EnrollmentWhereInput {
  switch (viewer.role) {
    case 'ADMIN':
      return {};
    case 'DEAN':
      return { program: { faculty: { deanUserId: viewer.id } } };
    default:
      return { userId: viewer.id };
  }
}

export async function findByIdOwnedBy(
  id: string,
  viewer: Viewer,
): Promise<EnrollmentWithRelations | null> {
  return prisma.enrollment.findFirst({
    where: { id, ...visibilityWhere(viewer) },
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
  program: { name: string; faculty: { name: string } } | null;
  period: { code: string };
  interviews: Interview[];
};

export interface ReviewListOptions {
  page: number;
  pageSize: number;
  status?: EnrollmentStatus | undefined;
  periodId?: string | undefined;
  search?: string | undefined;
  /**
   * Restringe la bandeja a la facultad que dirige esta persona.
   *
   * Va aquí y no en un filtro posterior por el mismo motivo que el resto: lo
   * que no corresponde no llega a leerse.
   */
  deanUserId?: string | undefined;
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
    ...(options.deanUserId
      ? {
          program: { faculty: { deanUserId: options.deanUserId } },
          // Al decano no le llega nada antes de que el administrador se lo
          // entregue: hasta entonces la inscripción no es asunto suyo.
          status: options.status ?? {
            in: ['PENDING_INTERVIEW', 'INTERVIEW_SCHEDULED', 'INTERVIEW_HELD', 'APPROVED', 'REJECTED'],
          },
        }
      : {}),
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
    program: { select: { name: true, faculty: { select: { name: true } } } },
    period: { select: { code: true } },
    interviews: { orderBy: { createdAt: 'desc' } },
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
 * El pago y la entrevista se comprueban **dentro**: hacerlo antes dejaría una
 * ventana en la que otra persona podría deshacer la verificación o mover la
 * cita entre la comprobación y la escritura.
 *
 * Y las dos escrituras van juntas porque una inscripción aprobada cuyo dueño
 * sigue siendo aspirante —o un estudiante sin inscripción aprobada— son estados
 * que nadie podría explicar mirando la base de datos.
 */
export async function approveAndPromote(
  id: string,
  deciderId: string,
): Promise<{ ok: true } | { ok: false; reason: 'sin-pago-verificado' | 'sin-entrevista' }> {
  return prisma.$transaction(async (tx) => {
    const receipt = await tx.paymentReceipt.findUnique({ where: { enrollmentId: id } });
    if (!receipt || receipt.status !== 'VERIFIED') {
      return { ok: false as const, reason: 'sin-pago-verificado' as const };
    }

    const entrevista = await tx.interview.findFirst({
      where: { enrollmentId: id, outcome: 'HELD' },
    });
    if (!entrevista) {
      return { ok: false as const, reason: 'sin-entrevista' as const };
    }

    const enrollment = await tx.enrollment.update({
      where: { id },
      data: {
        status: 'APPROVED',
        // Quién decidió, no quién revisó: son dos personas desde este change.
        decidedAt: new Date(),
        decidedByUserId: deciderId,
        rejectionReason: null,
      },
      select: { userId: true },
    });

    await tx.user.update({ where: { id: enrollment.userId }, data: { role: 'STUDENT' } });

    return { ok: true as const };
  });
}

