import { Router, type RequestHandler } from 'express';
import { createPeriodSchema, updatePeriodSchema, type ManagedPeriod } from '@repo/contracts';
import { requireAuth, requireRole } from '../../shared/middleware/require-auth';
import { ConflictError, NotFoundError, ValidationError } from '../../shared/errors';
import { prisma } from '../../shared/database/prisma';

function idOf(req: Parameters<RequestHandler>[0]): string {
  const id = req.params['id'];
  if (typeof id !== 'string' || id.length === 0) {
    throw new ValidationError('Falta el identificador del periodo.');
  }
  return id;
}

function fieldErrors(
  issues: readonly { path: readonly PropertyKey[]; message: string }[],
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of issues) {
    result[issue.path.map(String).join('.')] ??= issue.message;
  }
  return result;
}

interface PeriodRow {
  id: string;
  code: string;
  opensAt: Date;
  closesAt: Date;
  enrollmentFeeAmount: unknown;
  currency: string;
  isActive: boolean;
  _count: { enrollments: number };
}

function toManagedPeriod(row: PeriodRow): ManagedPeriod {
  return {
    id: row.id,
    code: row.code,
    opensAt: row.opensAt.toISOString(),
    closesAt: row.closesAt.toISOString(),
    enrollmentFeeAmount: Number(row.enrollmentFeeAmount),
    currency: row.currency,
    isActive: row.isActive,
    // Cuántas inscripciones cuelgan de él: es lo que hace evidente por qué un
    // periodo se desactiva en vez de borrarse.
    enrollmentCount: row._count.enrollments,
  };
}

const list: RequestHandler = async (_req, res, next) => {
  try {
    const rows = await prisma.academicPeriod.findMany({
      include: { _count: { select: { enrollments: true } } },
      orderBy: { opensAt: 'desc' },
    });
    res.status(200).json(rows.map((r) => toManagedPeriod(r as unknown as PeriodRow)));
  } catch (error) {
    next(error);
  }
};

const create: RequestHandler = async (req, res, next) => {
  try {
    const parsed = createPeriodSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Revisa los datos del periodo.', fieldErrors(parsed.error.issues));
    }

    const existing = await prisma.academicPeriod.findUnique({ where: { code: parsed.data.code } });
    if (existing) throw new ConflictError(`Ya existe el periodo ${parsed.data.code}.`);

    const row = await prisma.academicPeriod.create({
      data: {
        code: parsed.data.code,
        opensAt: new Date(parsed.data.opensAt),
        closesAt: new Date(parsed.data.closesAt),
        enrollmentFeeAmount: parsed.data.enrollmentFeeAmount,
        isActive: parsed.data.isActive,
      },
      include: { _count: { select: { enrollments: true } } },
    });

    res.status(201).json(toManagedPeriod(row as unknown as PeriodRow));
  } catch (error) {
    next(error);
  }
};

const update: RequestHandler = async (req, res, next) => {
  try {
    const parsed = updatePeriodSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Revisa los datos del periodo.', fieldErrors(parsed.error.issues));
    }

    const id = idOf(req);
    const existing = await prisma.academicPeriod.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('No encontramos ese periodo.');

    // La tarifa nueva solo rige para los recibos que se emitan a partir de
    // ahora: los ya emitidos copiaron su valor y no se tocan.
    const row = await prisma.academicPeriod.update({
      where: { id },
      data: {
        opensAt: new Date(parsed.data.opensAt),
        closesAt: new Date(parsed.data.closesAt),
        enrollmentFeeAmount: parsed.data.enrollmentFeeAmount,
        isActive: parsed.data.isActive,
      },
      include: { _count: { select: { enrollments: true } } },
    });

    res.status(200).json(toManagedPeriod(row as unknown as PeriodRow));
  } catch (error) {
    next(error);
  }
};

export const catalogAdminRoutes: Router = Router();

const soloAdmin = [requireAuth, requireRole('ADMIN')] as const;

catalogAdminRoutes.get('/admin/periods', ...soloAdmin, list);
catalogAdminRoutes.post('/admin/periods', ...soloAdmin, create);
catalogAdminRoutes.patch('/admin/periods/:id', ...soloAdmin, update);
