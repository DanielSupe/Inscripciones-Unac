import type { RequestHandler } from 'express';
import { setFacultyGoalSchema } from '@repo/contracts';
import { ValidationError } from '../../shared/errors';
import * as goalsService from './goals.service';

function facultyIdOf(req: Parameters<RequestHandler>[0]): string {
  const id = req.params['facultyId'];
  if (typeof id !== 'string' || id.length === 0) {
    throw new ValidationError('Falta el identificador de la facultad.');
  }
  return id;
}

/** Traduce los problemas de validación a un detalle por campo. */
function fieldErrors(
  issues: readonly { path: readonly PropertyKey[]; message: string }[],
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of issues) {
    result[issue.path.map(String).join('.')] ??= issue.message;
  }
  return result;
}

export const list: RequestHandler = async (_req, res, next) => {
  try {
    res.status(200).json(await goalsService.listProgress());
  } catch (error) {
    next(error);
  }
};

export const setGoal: RequestHandler = async (req, res, next) => {
  try {
    const parsed = setFacultyGoalSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Revisa la meta.', fieldErrors(parsed.error.issues));
    }

    await goalsService.setGoal(facultyIdOf(req), parsed.data.target);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

export const clearGoal: RequestHandler = async (req, res, next) => {
  try {
    await goalsService.clearGoal(facultyIdOf(req));
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};
