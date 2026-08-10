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
