import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '@repo/config/server';

/**
 * Único punto del backend que habla con el almacenamiento.
 *
 * El archivo nunca pasa por aquí: este módulo solo firma permisos temporales
 * para que el navegador escriba o lea directamente. El backend no tiene disco y
 * no podría hacer de intermediario aunque quisiera.
 */
const client = new S3Client({
  region: env.S3_REGION,
  // Vacío con AWS; se fija solo con almacenamiento compatible con S3.
  ...(env.S3_ENDPOINT ? { endpoint: env.S3_ENDPOINT, forcePathStyle: env.S3_FORCE_PATH_STYLE } : {}),
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  },
});

/**
 * Compone la clave del objeto.
 *
 * La compone el servidor y nunca el cliente: proponer la clave sería poder
 * elegir dónde se escribe. Al ser determinista, volver a adjuntar el mismo tipo
 * sustituye en vez de acumular.
 */
export function objectKey(enrollmentId: string, attachmentType: string): string {
  return `enrollments/${enrollmentId}/${attachmentType}`;
}

/** Permiso temporal de escritura, restringido al tipo de contenido declarado. */
export async function signUpload(key: string, contentType: string): Promise<string> {
  return getSignedUrl(client, new PutObjectCommand({ Bucket: env.S3_BUCKET, Key: key, ContentType: contentType }), {
    expiresIn: env.S3_PRESIGN_EXPIRES_SECONDS,
  });
}

/** Permiso temporal de lectura. Caduca, que es lo que impide compartir el enlace. */
export async function signDownload(key: string, filename: string): Promise<string> {
  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      ResponseContentDisposition: `inline; filename="${filename}"`,
    }),
    { expiresIn: env.S3_PRESIGN_EXPIRES_SECONDS },
  );
}

export async function deleteObject(key: string): Promise<void> {
  await client.send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
}
