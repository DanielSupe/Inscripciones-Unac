import type { RequestHandler } from 'express';
import * as dashboardService from './dashboard.service';

export const get: RequestHandler = async (_req, res, next) => {
  try {
    res.status(200).json(await dashboardService.getDashboard());
  } catch (error) {
    next(error);
  }
};
