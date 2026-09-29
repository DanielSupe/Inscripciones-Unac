import { prisma } from '../../shared/database/prisma';

/** Una facultad activa, con su meta si tiene una. */
export interface FacultyWithGoal {
  id: string;
  name: string;
  target: number | null;
}

/**
 * Facultades activas con su meta (si la tienen) y, aparte, cuántas
 * inscripciones `APPROVED` cuelgan de los programas de cada una.
 *
 * Van en dos consultas porque son formas distintas: la primera es una fila
 * por facultad, la segunda un agregado por programa. Sumar el agregado por
 * facultad se hace en el service, que es quien arma el DTO.
 */
export async function findActiveFacultiesWithGoals(): Promise<FacultyWithGoal[]> {
  const faculties = await prisma.faculty.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, goal: { select: { target: true } } },
  });

  return faculties.map((f) => ({ id: f.id, name: f.name, target: f.goal?.target ?? null }));
}

/**
 * Matriculados por facultad: inscripciones `APPROVED` agrupadas por el
 * programa al que pertenecen, resuelto en la base de datos y no trayendo
 * filas para contarlas en memoria.
 */
export async function countApprovedByFaculty(): Promise<Map<string, number>> {
  const rows = await prisma.enrollment.groupBy({
    by: ['programId'],
    where: { status: 'APPROVED', programId: { not: null } },
    _count: { _all: true },
  });

  if (rows.length === 0) return new Map();

  const programIds = rows.map((r) => r.programId).filter((id): id is string => id !== null);
  const programs = await prisma.academicProgram.findMany({
    where: { id: { in: programIds } },
    select: { id: true, facultyId: true },
  });
  const facultyByProgram = new Map(programs.map((p) => [p.id, p.facultyId]));

  const counts = new Map<string, number>();
  for (const row of rows) {
    if (!row.programId) continue;
    const facultyId = facultyByProgram.get(row.programId);
    if (!facultyId) continue;
    counts.set(facultyId, (counts.get(facultyId) ?? 0) + row._count._all);
  }
  return counts;
}

/** Fija la meta de una facultad, reemplazando la anterior si existía. */
export async function upsertGoal(facultyId: string, target: number): Promise<void> {
  await prisma.facultyEnrollmentGoal.upsert({
    where: { facultyId },
    create: { facultyId, target },
    update: { target },
  });
}

/** Quita la meta de una facultad. Idempotente: no falla si no había ninguna. */
export async function deleteGoal(facultyId: string): Promise<void> {
  await prisma.facultyEnrollmentGoal.deleteMany({ where: { facultyId } });
}
