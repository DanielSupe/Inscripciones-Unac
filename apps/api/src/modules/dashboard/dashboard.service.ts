import type { AdminDashboard, DashboardGoal, FacultyGoalRow } from '@repo/contracts';
import * as enrollmentService from '../enrollment/enrollment.service';
import * as goalsService from '../goals/goals.service';
import * as receiptService from '../receipt/receipt.service';

/**
 * Meta global a partir de las filas por facultad.
 *
 * El avance solo compara lo comparable: los matriculados de una facultad sin
 * meta entran en el total, pero no en el porcentaje. Si contaran, bastaría con
 * no fijarle meta a una facultad grande para inflar el avance de todas.
 */
export function summarizeGoals(rows: readonly FacultyGoalRow[]): DashboardGoal {
  let targetSum = 0;
  let enrolledTowardGoal = 0;
  let totalEnrolled = 0;
  let facultiesWithoutGoal = 0;

  for (const row of rows) {
    totalEnrolled += row.enrolledCount;
    if (row.target === null) {
      facultiesWithoutGoal += 1;
    } else {
      targetSum += row.target;
      enrolledTowardGoal += row.enrolledCount;
    }
  }

  const globalTarget = facultiesWithoutGoal === rows.length ? null : targetSum;

  return {
    globalTarget,
    enrolledTowardGoal,
    progressPercent:
      globalTarget === null ? null : Math.round((enrolledTowardGoal / globalTarget) * 100),
    totalEnrolled,
    facultiesWithoutGoal,
  };
}

export async function getDashboard(): Promise<AdminDashboard> {
  const [goalRows, funnel, payments] = await Promise.all([
    goalsService.listProgress(),
    enrollmentService.countByStatus(),
    receiptService.countByStatus(),
  ]);

  return { goal: summarizeGoals(goalRows), funnel, payments };
}
