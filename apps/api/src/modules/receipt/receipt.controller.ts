import type { RequestHandler } from 'express';
import { DOCUMENT_TYPE_LABELS } from '@repo/contracts';
import { ConflictError, NotFoundError, UnauthorizedError, ValidationError } from '../../shared/errors';
import * as enrollmentService from '../enrollment/enrollment.service';
import * as catalogService from '../catalog/catalog.service';
import * as usersService from '../users/users.service';
import * as receiptService from './receipt.service';
import { renderReceiptPdf } from './receipt.pdf';

function sessionOf(req: Parameters<RequestHandler>[0]) {
  if (!req.session) throw new UnauthorizedError('Necesitas iniciar sesión para hacer esto.');
  return req.session;
}

function enrollmentIdOf(req: Parameters<RequestHandler>[0]): string {
  const id = req.params['id'];
  if (typeof id !== 'string' || id.length === 0) {
    throw new ValidationError('Falta el identificador de la inscripción.');
  }
  return id;
}

/**
 * Reúne lo que lleva impreso el recibo.
 *
 * La pertenencia la resuelve `loadOwnedRow`: si la inscripción no es de quien
 * pregunta, sale como inexistente antes de tocar nada más.
 */
async function loadReceiptData(req: Parameters<RequestHandler>[0]) {
  const enrollment = await enrollmentService.loadOwnedRow(enrollmentIdOf(req), sessionOf(req));

  const receipt = await receiptService.findByEnrollmentId(enrollment.id);
  if (!receipt) {
    throw new ConflictError('Tu recibo se emite cuando termines y envíes tu inscripción.');
  }

  const [period, program, user] = await Promise.all([
    catalogService.findPeriodById(enrollment.periodId),
    enrollment.programId ? catalogService.findProgramById(enrollment.programId) : null,
    usersService.findActiveById(enrollment.userId),
  ]);
  if (!period || !user) throw new NotFoundError('No encontramos los datos de este recibo.');

  return { enrollment, receipt, period, program, user };
}

export const getReceipt: RequestHandler = async (req, res, next) => {
  try {
    const { receipt } = await loadReceiptData(req);
    res.status(200).json({
      receiptNumber: receipt.receiptNumber,
      amount: Number(receipt.amount),
      currency: receipt.currency,
      issuedAt: receipt.issuedAt.toISOString(),
      dueAt: receipt.dueAt.toISOString(),
      status: receipt.status,
    });
  } catch (error) {
    next(error);
  }
};

export const downloadReceipt: RequestHandler = async (req, res, next) => {
  try {
    const { receipt, period, program, user, enrollment } = await loadReceiptData(req);

    const pdf = renderReceiptPdf({
      receiptNumber: receipt.receiptNumber,
      amount: Number(receipt.amount),
      currency: receipt.currency,
      issuedAt: receipt.issuedAt,
      dueAt: receipt.dueAt,
      applicantName: `${enrollment.firstName ?? ''} ${enrollment.lastName ?? ''}`.trim(),
      documentType: DOCUMENT_TYPE_LABELS[user.documentType],
      documentNumber: user.documentNumber,
      programName: program?.name ?? 'Sin programa',
      periodCode: period.code,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="recibo-${receipt.receiptNumber}.pdf"`);
    pdf.pipe(res);
  } catch (error) {
    next(error);
  }
};
