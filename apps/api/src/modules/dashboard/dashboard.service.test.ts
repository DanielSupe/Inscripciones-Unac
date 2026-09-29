import { describe, expect, it } from 'vitest';
import type { FacultyGoalRow } from '@repo/contracts';
import { summarizeGoals } from './dashboard.service';

function fila(target: number | null, enrolledCount: number): FacultyGoalRow {
  return {
    facultyId: `fac-${String(Math.random())}`,
    facultyName: 'Facultad',
    target,
    enrolledCount,
    progressPercent: null,
  };
}

describe('summarizeGoals', () => {
  it('suma las metas y los matriculados cuando todas las facultades tienen meta', () => {
    expect(summarizeGoals([fila(100, 60), fila(50, 30)])).toEqual({
      globalTarget: 150,
      enrolledTowardGoal: 90,
      progressPercent: 60,
      totalEnrolled: 90,
      facultiesWithoutGoal: 0,
    });
  });

  it('no deja que una facultad sin meta infle el avance, pero la cuenta en el total', () => {
    expect(summarizeGoals([fila(100, 40), fila(null, 25)])).toEqual({
      globalTarget: 100,
      enrolledTowardGoal: 40,
      progressPercent: 40,
      totalEnrolled: 65,
      facultiesWithoutGoal: 1,
    });
  });

  it('deja la meta global y el avance sin definir cuando ninguna facultad tiene meta', () => {
    const resumen = summarizeGoals([fila(null, 12)]);
    expect(resumen.globalTarget).toBeNull();
    expect(resumen.progressPercent).toBeNull();
    expect(resumen.totalEnrolled).toBe(12);
  });

  it('no recorta el avance al 100 % cuando se supera la meta', () => {
    expect(summarizeGoals([fila(80, 100)]).progressPercent).toBe(125);
  });

  it('no inventa una meta cuando no hay facultades activas', () => {
    expect(summarizeGoals([]).globalTarget).toBeNull();
  });
});
