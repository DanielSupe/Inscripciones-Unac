import type { AcademicPeriod, AcademicProgram as ProgramRow, Faculty } from '@prisma/client';
import { prisma } from '../../shared/database/prisma';

export type { AcademicPeriod, Faculty };

/**
 * El programa viaja siempre con su facultad.
 *
 * Es el vínculo por el que una inscripción encuentra a su decano, así que
 * cargarlo aparte cuando hiciera falta abriría la puerta a olvidarlo justo
 * donde importa.
 */
export type AcademicProgram = ProgramRow & { faculty: Faculty };

const withFaculty = { faculty: true } as const;

/** Programas en oferta, en el orden en que se le muestran al aspirante. */
export async function findActivePrograms(): Promise<AcademicProgram[]> {
  return prisma.academicProgram.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    include: withFaculty,
  });
}

/** Un programa concreto, esté o no en oferta: hace falta para leer inscripciones antiguas. */
export async function findProgramById(id: string): Promise<AcademicProgram | null> {
  return prisma.academicProgram.findUnique({ where: { id }, include: withFaculty });
}

/** El decano que dirige la facultad de un programa, si lo hay. */
export async function findDeanOfProgram(programId: string): Promise<string | null> {
  const program = await prisma.academicProgram.findUnique({
    where: { id: programId },
    select: { faculty: { select: { deanUserId: true } } },
  });
  return program?.faculty.deanUserId ?? null;
}

/** La facultad que dirige una persona, si dirige alguna. */
export async function findFacultyLedBy(userId: string): Promise<Faculty | null> {
  return prisma.faculty.findUnique({ where: { deanUserId: userId } });
}

/**
 * Periodo cuya ventana contiene la fecha dada.
 *
 * La fecha se recibe en vez de leerse aquí para que las pruebas puedan situarse
 * antes de abrir o después de cerrar sin tocar el reloj del sistema.
 */
export async function findOpenPeriodAt(moment: Date): Promise<AcademicPeriod | null> {
  return prisma.academicPeriod.findFirst({
    where: {
      isActive: true,
      opensAt: { lte: moment },
      closesAt: { gte: moment },
    },
    orderBy: { opensAt: 'desc' },
  });
}

/** El periodo que abrirá antes, para poder decir desde cuándo se podrá inscribir. */
export async function findNextPeriodAfter(moment: Date): Promise<AcademicPeriod | null> {
  return prisma.academicPeriod.findFirst({
    where: { isActive: true, opensAt: { gt: moment } },
    orderBy: { opensAt: 'asc' },
  });
}

export async function findPeriodById(id: string): Promise<AcademicPeriod | null> {
  return prisma.academicPeriod.findUnique({ where: { id } });
}

/**
 * Reserva el siguiente número de recibo de un periodo.
 *
 * El incremento lo hace la base de datos en una sola sentencia. Leer el
 * contador en la aplicación y sumarle uno daría el mismo número a dos envíos
 * simultáneos.
 */
export async function nextReceiptSequence(periodId: string): Promise<number> {
  const period = await prisma.academicPeriod.update({
    where: { id: periodId },
    data: { receiptCounter: { increment: 1 } },
    select: { receiptCounter: true },
  });
  return period.receiptCounter;
}
