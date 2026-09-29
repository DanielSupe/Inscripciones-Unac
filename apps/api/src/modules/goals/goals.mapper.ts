import type { FacultyGoalRow } from '@repo/contracts';
import type { FacultyWithGoal } from './goals.repository';

/**
 * Fila de base de datos → DTO público.
 *
 * `target` en `null` significa «sin meta»; en ese caso `progressPercent`
 * también es `null`, nunca 0 — un 0 se leería como «lleva cero» en vez de
 * «no hay meta con la que compararlo».
 */
export function toFacultyGoalRow(faculty: FacultyWithGoal, enrolledCount: number): FacultyGoalRow {
  const target = faculty.target;
  const progressPercent = target === null ? null : Math.round((enrolledCount / target) * 100);

  return {
    facultyId: faculty.id,
    facultyName: faculty.name,
    target,
    enrolledCount,
    progressPercent,
  };
}
