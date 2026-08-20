import type { AcademicPeriod, AcademicProgram, Catalog } from '@repo/contracts';
import { ConflictError, NotFoundError } from '../../shared/errors';
import * as catalogRepository from './catalog.repository';
import type { AcademicPeriod as PeriodRow, AcademicProgram as ProgramRow } from './catalog.repository';

function toProgram(row: ProgramRow): AcademicProgram {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    faculty: { id: row.faculty.id, code: row.faculty.code, name: row.faculty.name },
  };
}

function toPeriod(row: PeriodRow): AcademicPeriod {
  return {
    id: row.id,
    code: row.code,
    opensAt: row.opensAt.toISOString(),
    closesAt: row.closesAt.toISOString(),
    // Decimal no sobrevive a JSON; se convierte aquí, en el borde del módulo.
    enrollmentFeeAmount: Number(row.enrollmentFeeAmount),
    currency: row.currency,
  };
}

export async function getCatalog(moment: Date = new Date()): Promise<Catalog> {
  const [programs, openPeriod] = await Promise.all([
    catalogRepository.findActivePrograms(),
    catalogRepository.findOpenPeriodAt(moment),
  ]);

  return {
    programs: programs.map(toProgram),
    openPeriod: openPeriod ? toPeriod(openPeriod) : null,
  };
}

/**
 * Devuelve el periodo abierto, o explica por qué no hay ninguno.
 *
 * Distingue «todavía no abre» de «ya cerró» de «no hay nada configurado»
 * porque son tres situaciones distintas para quien está intentando inscribirse,
 * y un único «no se puede» las dejaría a las tres sin salida.
 */
export async function requireOpenPeriod(moment: Date = new Date()): Promise<PeriodRow> {
  const open = await catalogRepository.findOpenPeriodAt(moment);
  if (open) return open;

  const next = await catalogRepository.findNextPeriodAfter(moment);
  if (next) {
    throw new ConflictError(
      `Las inscripciones para el periodo ${next.code} abren el ${next.opensAt.toLocaleDateString('es-CO')}.`,
    );
  }

  throw new ConflictError('No hay inscripciones abiertas en este momento.');
}

/** Comprueba que el periodo indicado sigue abierto. Lo usa la transición de envío. */
export async function isPeriodOpen(periodId: string, moment: Date = new Date()): Promise<boolean> {
  const period = await catalogRepository.findPeriodById(periodId);
  if (!period || !period.isActive) return false;
  return period.opensAt <= moment && period.closesAt >= moment;
}

/** Comprueba que el programa existe y está en oferta. Lo usa el guardado de la aspiración. */
export async function requireActiveProgram(programId: string): Promise<ProgramRow> {
  const program = await catalogRepository.findProgramById(programId);
  if (!program || !program.isActive) {
    throw new NotFoundError('Ese programa no está disponible.');
  }
  return program;
}

export async function findPeriodById(id: string): Promise<PeriodRow | null> {
  return catalogRepository.findPeriodById(id);
}

export async function findProgramById(id: string): Promise<ProgramRow | null> {
  return catalogRepository.findProgramById(id);
}

export async function nextReceiptSequence(periodId: string): Promise<number> {
  return catalogRepository.nextReceiptSequence(periodId);
}

export { toPeriod, toProgram };

/**
 * Quién dirige la facultad del programa elegido, si hay alguien.
 *
 * Los módulos se hablan por services: `enrollment` pregunta aquí en vez de
 * alcanzar el repositorio del catálogo.
 */
export async function findDeanOfProgram(programId: string): Promise<string | null> {
  return catalogRepository.findDeanOfProgram(programId);
}

/** La facultad que dirige una persona, si dirige alguna. */
export async function findFacultyLedBy(userId: string) {
  return catalogRepository.findFacultyLedBy(userId);
}
