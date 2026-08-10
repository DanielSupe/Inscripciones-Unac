import type { AttachmentType, EnrollmentAttachment } from '@prisma/client';
import { prisma } from '../../shared/database/prisma';

export type { EnrollmentAttachment };

export interface UpsertAttachment {
  enrollmentId: string;
  type: AttachmentType;
  storageKey: string;
  contentType: string;
  sizeBytes: number;
}

/**
 * Registra el adjunto, sustituyendo el anterior del mismo tipo.
 *
 * Es un upsert sobre (inscripción, tipo) porque la spec pide que adjuntar de
 * nuevo reemplace y no acumule. Como la clave del objeto es determinista, el
 * archivo anterior ya quedó sobrescrito en el almacenamiento.
 */
export async function upsert(data: UpsertAttachment): Promise<EnrollmentAttachment> {
  const { enrollmentId, type, ...rest } = data;
  return prisma.enrollmentAttachment.upsert({
    where: { enrollmentId_type: { enrollmentId, type } },
    create: { enrollmentId, type, ...rest },
    update: { ...rest, uploadedAt: new Date() },
  });
}

export async function findByEnrollmentAndType(
  enrollmentId: string,
  type: AttachmentType,
): Promise<EnrollmentAttachment | null> {
  return prisma.enrollmentAttachment.findUnique({
    where: { enrollmentId_type: { enrollmentId, type } },
  });
}
