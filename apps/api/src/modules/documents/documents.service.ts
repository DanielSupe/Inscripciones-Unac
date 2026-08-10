import { env } from '@repo/config/server';
import {
  ATTACHMENT_TYPE_LABELS,
  type AttachmentType,
  type SessionUser,
  type UploadTicket,
  type UploadTicketRequest,
} from '@repo/contracts';
import { ConflictError, NotFoundError, ValidationError } from '../../shared/errors';
import * as storage from '../../shared/storage/storage';
import * as enrollmentService from '../enrollment/enrollment.service';
import { isEditable } from '../enrollment/enrollment.transitions';
import * as documentsRepository from './documents.repository';

function requireEditable(status: Parameters<typeof isEditable>[0]): void {
  if (!isEditable(status)) {
    throw new ConflictError(
      'Esta inscripción ya fue enviada; sus documentos no se pueden cambiar.',
    );
  }
}

/**
 * Concede permiso para subir un documento.
 *
 * El tipo y el tamaño se comprueban **antes** de firmar, de modo que el permiso
 * salga ya restringido y no sirva para subir otra cosa. Validar después de
 * firmar sería validar cuando el archivo ya está dentro.
 */
export async function requestUploadTicket(
  enrollmentId: string,
  session: SessionUser,
  request: UploadTicketRequest,
): Promise<UploadTicket> {
  const enrollment = await enrollmentService.loadOwnedRow(enrollmentId, session);
  requireEditable(enrollment.status);

  if (request.sizeBytes > env.MAX_UPLOAD_BYTES) {
    const megas = (env.MAX_UPLOAD_BYTES / 1_048_576).toFixed(1);
    throw new ValidationError(`El archivo supera el tamaño máximo de ${megas} MB.`, {
      sizeBytes: `Máximo ${megas} MB`,
    });
  }

  const key = storage.objectKey(enrollment.id, request.type);
  return {
    url: await storage.signUpload(key, request.contentType),
    expiresInSeconds: env.S3_PRESIGN_EXPIRES_SECONDS,
  };
}

/**
 * Registra que la subida terminó.
 *
 * Hace falta porque el almacenamiento no le cuenta al backend que el archivo
 * llegó. Si esta confirmación nunca llega, el documento no consta como
 * adjuntado y el aspirante no podrá enviar: es el comportamiento correcto.
 */
export async function confirmUpload(
  enrollmentId: string,
  session: SessionUser,
  request: UploadTicketRequest,
): Promise<void> {
  const enrollment = await enrollmentService.loadOwnedRow(enrollmentId, session);
  requireEditable(enrollment.status);

  await documentsRepository.upsert({
    enrollmentId: enrollment.id,
    type: request.type,
    storageKey: storage.objectKey(enrollment.id, request.type),
    contentType: request.contentType,
    sizeBytes: request.sizeBytes,
  });
}

/**
 * Concede acceso temporal para ver un documento.
 *
 * La pertenencia se comprueba antes de firmar. La dirección resultante caduca,
 * así que compartirla no da acceso permanente.
 */
export async function requestDownloadUrl(
  enrollmentId: string,
  session: SessionUser,
  type: AttachmentType,
): Promise<string> {
  const enrollment = await enrollmentService.loadOwnedRow(enrollmentId, session);

  const attachment = await documentsRepository.findByEnrollmentAndType(enrollment.id, type);
  if (!attachment) throw new NotFoundError('Ese documento no está adjunto.');

  return storage.signDownload(attachment.storageKey, `${ATTACHMENT_TYPE_LABELS[type]}`);
}
