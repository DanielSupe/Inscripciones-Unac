import type { RequestHandler } from 'express';
import { interviewOutcomeRequestSchema, scheduleInterviewSchema } from '@repo/contracts';
import { UnauthorizedError, ValidationError } from '../../shared/errors';
import * as interviewService from './interview.service';

function sessionOf(req: Parameters<RequestHandler>[0]) {
  if (!req.session) throw new UnauthorizedError('Necesitas iniciar sesión para hacer esto.');
  return req.session;
}

function idOf(req: Parameters<RequestHandler>[0]): string {
  const id = req.params['id'];
  if (typeof id !== 'string' || id.length === 0) {
    throw new ValidationError('Falta el identificador de la inscripción.');
  }
  return id;
}

function parseSchedule(body: unknown) {
  const parsed = scheduleInterviewSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(
      'Revisa los datos de la entrevista.',
      Object.fromEntries(parsed.error.issues.map((i) => [i.path.map(String).join('.'), i.message])),
    );
  }
  return parsed.data;
}

export const schedule: RequestHandler = async (req, res, next) => {
  try {
    const data = parseSchedule(req.body);
    res.status(201).json(await interviewService.schedule(idOf(req), sessionOf(req), data));
  } catch (error) {
    next(error);
  }
};

export const reschedule: RequestHandler = async (req, res, next) => {
  try {
    const data = parseSchedule(req.body);
    res.status(200).json(await interviewService.reschedule(idOf(req), sessionOf(req), data));
  } catch (error) {
    next(error);
  }
};

export const declareOutcome: RequestHandler = async (req, res, next) => {
  try {
    const parsed = interviewOutcomeRequestSchema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError('Indica cómo terminó la entrevista.');

    res
      .status(200)
      .json(await interviewService.declareOutcome(idOf(req), sessionOf(req), parsed.data.outcome));
  } catch (error) {
    next(error);
  }
};
