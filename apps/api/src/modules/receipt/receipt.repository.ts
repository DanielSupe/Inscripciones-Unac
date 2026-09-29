import type { PaymentReceipt } from '@prisma/client';
import { prisma } from '../../shared/database/prisma';

export type { PaymentReceipt };

export interface NewReceipt {
  enrollmentId: string;
  receiptNumber: string;
  amount: number;
  currency: string;
  dueAt: Date;
}

export async function create(data: NewReceipt): Promise<PaymentReceipt> {
  return prisma.paymentReceipt.create({ data });
}

export async function findByEnrollmentId(enrollmentId: string): Promise<PaymentReceipt | null> {
  return prisma.paymentReceipt.findUnique({ where: { enrollmentId } });
}

export async function setPaymentStatus(
  enrollmentId: string,
  verified: boolean,
  verifierId: string,
): Promise<PaymentReceipt> {
  return prisma.paymentReceipt.update({
    where: { enrollmentId },
    data: verified
      ? { status: 'VERIFIED', verifiedAt: new Date(), verifiedByUserId: verifierId }
      : { status: 'PENDING', verifiedAt: null, verifiedByUserId: null },
  });
}

/** Recibos por estado de pago, agregados en la base de datos. */
export async function countByStatus(): Promise<{ status: PaymentReceipt['status']; count: number }[]> {
  const rows = await prisma.paymentReceipt.groupBy({ by: ['status'], _count: { _all: true } });
  return rows.map((r) => ({ status: r.status, count: r._count._all }));
}
