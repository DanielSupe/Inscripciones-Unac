import type { FacultyGoalRow } from '@repo/contracts';
import * as catalogService from '../catalog/catalog.service';
import * as goalsRepository from './goals.repository';
import { toFacultyGoalRow } from './goals.mapper';

/** Listado de avance de todas las facultades activas. */
export async function listProgress(): Promise<FacultyGoalRow[]> {
  const [faculties, countsByFaculty] = await Promise.all([
    goalsRepository.findActiveFacultiesWithGoals(),
    goalsRepository.countApprovedByFaculty(),
  ]);

  return faculties.map((faculty) =>
    toFacultyGoalRow(faculty, countsByFaculty.get(faculty.id) ?? 0),
  );
}

/** Fija la meta de una facultad. Falla si la facultad no existe o está inactiva. */
export async function setGoal(facultyId: string, target: number): Promise<void> {
  await catalogService.requireActiveFaculty(facultyId);
  await goalsRepository.upsertGoal(facultyId, target);
}

/** Quita la meta de una facultad. Falla si la facultad no existe o está inactiva. */
export async function clearGoal(facultyId: string): Promise<void> {
  await catalogService.requireActiveFaculty(facultyId);
  await goalsRepository.deleteGoal(facultyId);
}
