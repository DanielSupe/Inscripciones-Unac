import { useState, type ChangeEvent } from 'react';
import {
  ALLOWED_ATTACHMENT_MIME_TYPES,
  ATTACHMENT_TYPES,
  ATTACHMENT_TYPE_LABELS,
  type Attachment,
  type AttachmentType,
} from '@repo/contracts';
import { useUploadDocument } from '../api/enrollment-queries';

/**
 * Paso de documentos.
 *
 * Cada archivo va del navegador al almacenamiento sin pasar por nuestro
 * servidor; lo único que viaja al API es el permiso antes y la confirmación
 * después.
 */
export function DocumentsStep({
  enrollmentId,
  attachments,
  onContinue,
}: {
  enrollmentId: string;
  attachments: Attachment[];
  onContinue: () => void;
}) {
  const upload = useUploadDocument(enrollmentId);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<AttachmentType | null>(null);

  const cargados = new Set(attachments.map((a) => a.type));
  const faltan = ATTACHMENT_TYPES.filter((t) => !cargados.has(t));

  async function handleFile(type: AttachmentType, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(type);
    try {
      await upload.mutateAsync({ type, file });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo subir el archivo.');
    } finally {
      setUploading(null);
      // Permite volver a elegir el mismo archivo tras un fallo.
      event.target.value = '';
    }
  }

  return (
    <div className="formulario">
      <p className="formulario__intro">
        Adjunta los dos documentos. Se admiten PDF, JPG y PNG de hasta 5 MB.
      </p>

      {error && (
        <p className="aviso-caja aviso-caja--error" role="alert">
          {error}
        </p>
      )}

      <ul className="documentos">
        {ATTACHMENT_TYPES.map((type) => {
          const adjunto = attachments.find((a) => a.type === type);
          const subiendo = uploading === type;

          return (
            <li key={type} className="documentos__item">
              <div>
                <p className="documentos__nombre">{ATTACHMENT_TYPE_LABELS[type]}</p>
                <p className={`documentos__estado ${adjunto ? 'documentos__estado--ok' : ''}`}>
                  {adjunto
                    ? `Cargado · ${(adjunto.sizeBytes / 1024).toFixed(0)} KB`
                    : 'Pendiente'}
                </p>
              </div>

              <label className="boton" htmlFor={`archivo-${type}`}>
                {subiendo ? 'Subiendo…' : adjunto ? 'Reemplazar' : 'Adjuntar'}
              </label>
              <input
                id={`archivo-${type}`}
                className="visualmente-oculto"
                type="file"
                accept={ALLOWED_ATTACHMENT_MIME_TYPES.join(',')}
                disabled={subiendo}
                onChange={(e) => void handleFile(type, e)}
              />
            </li>
          );
        })}
      </ul>

      <button type="button" onClick={onContinue} disabled={faltan.length > 0}>
        {faltan.length > 0
          ? `Falta adjuntar ${String(faltan.length)} documento(s)`
          : 'Continuar al envío'}
      </button>
    </div>
  );
}
