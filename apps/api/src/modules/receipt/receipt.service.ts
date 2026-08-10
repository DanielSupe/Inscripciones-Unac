import { env } from '@repo/config/server';
import { NotFoundError } from '../../shared/errors';
import * as catalogService from '../catalog/catalog.service';
import * as receiptRepository from './receipt.repository';
import type { PaymentReceipt } from './receipt.repository';

/**
 * Emite el recibo de una inscripción recién enviada.
 *
 * El valor se copia del periodo en vez de leerse por relación cada vez: un
 * recibo tiene valor probatorio y no puede cambiar porque alguien edite la
 * tarifa del semestre después de haberlo entregado.
 */
export async function issueFor(enrollmentId: string, periodId: string): Promise<PaymentReceipt> {
  const period = await catalogService.findPeriodById(periodId);
  if (!period) throw new NotFoundError('No encontramos el periodo de esta inscripción.');

  // El consecutivo lo reserva la base de datos con un incremento atómico: dos
  // envíos simultáneos obtendrían el mismo número si se leyera y se sumara aquí.
  const sequence = await catalogService.nextReceiptSequence(periodId);

  const dueAt = new Date();
  dueAt.setDate(dueAt.getDate() + env.RECEIPT_DUE_DAYS);

  return receiptRepository.create({
    enrollmentId,
    receiptNumber: `${period.code}-${String(sequence).padStart(6, '0')}`,
    amount: Number(period.enrollmentFeeAmount),
    currency: period.currency,
    dueAt,
  });
}

export async function findByEnrollmentId(enrollmentId: string): Promise<PaymentReceipt | null> {
  return receiptRepository.findByEnrollmentId(enrollmentId);
}
