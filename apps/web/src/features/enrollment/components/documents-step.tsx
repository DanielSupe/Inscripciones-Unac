import { useState, type ChangeEvent } from 'react';
import {
  ALLOWED_ATTACHMENT_MIME_TYPES,
  ATTACHMENT_TYPES,
  ATTACHMENT_TYPE_LABELS,
  type Attachment,
  type AttachmentType,
} from '@repo/contracts';
import { useUploadDocument } from '../api/enrollment-queries';
import { DocumentViewer, useDocumentViewer } from './document-viewer';

/** Qué es cada documento, en palabras de quien lo tiene que buscar. */
const AYUDA: Record<AttachmentType, string> = {
  IDENTITY: 'Tu cédula o tarjeta de identidad, por ambas caras.',
  ICFES: 'El certificado de resultados de tu prueba Saber 11.',
  DIPLOMA: 'Tu diploma de bachiller o el acta de grado.',
};

export function DocumentsStep({
  enrollmentId,
  attachments,
}: {
  enrollmentId: string;
  attachments: Attachment[];
}) {
  const upload = useUploadDocument(enrollmentId);
  const visor = useDocumentViewer();
  const [error, setError] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState<AttachmentType | null>(null);

  const cargados = new Map(attachments.map((a) => [a.type, a]));
  const enVisor = visor.abierto ? cargados.get(visor.abierto) : undefined;

  async function handleFile(type: AttachmentType, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setSubiendo(type);
    try {
      await upload.mutateAsync({ type, file });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo subir el archivo.');
    } finally {
      setSubiendo(null);
      // Permite volver a elegir el mismo archivo tras un fallo.
      event.target.value = '';
    }
  }

  return (
    <div className="paso">
      <p className="paso__ayuda">
        Sube los tres documentos. Aceptamos PDF, JPG y PNG de hasta 5 MB. Puedes revisarlos antes
        de enviar y reemplazar el que no se lea bien.
      </p>

      {error && (
        <p className="aviso-caja aviso-caja--error" role="alert">
          {error}
        </p>
      )}

      <ul className="docs">
        {ATTACHMENT_TYPES.map((type) => {
          const adjunto = cargados.get(type);
          const cargando = subiendo === type;

          return (
            <li key={type} className={`docs__ficha ${adjunto ? 'docs__ficha--lista' : ''}`}>
              <div className="docs__marca" aria-hidden="true">
                {adjunto ? '✓' : ''}
              </div>

              <div className="docs__cuerpo">
                <p className="docs__nombre">{ATTACHMENT_TYPE_LABELS[type]}</p>
                <p className="docs__ayuda">{AYUDA[type]}</p>
                {adjunto && (
                  <p className="docs__estado">
                    Cargado · {(adjunto.sizeBytes / 1024).toFixed(0)} KB
                  </p>
                )}
              </div>

              <div className="docs__acciones">
                {adjunto && (
                  <button type="button" onClick={() => { visor.abrir(type); }}>
                    Ver
                  </button>
                )}
                <label className="boton" htmlFor={`archivo-${type}`}>
                  {cargando ? 'Subiendo…' : adjunto ? 'Reemplazar' : 'Adjuntar'}
                </label>
                <input
                  id={`archivo-${type}`}
                  className="visualmente-oculto"
                  type="file"
                  accept={ALLOWED_ATTACHMENT_MIME_TYPES.join(',')}
                  disabled={cargando}
                  onChange={(e) => void handleFile(type, e)}
                />
              </div>
            </li>
          );
        })}
      </ul>

      {enVisor && (
        <DocumentViewer
          enrollmentId={enrollmentId}
          attachment={enVisor}
          onClose={visor.cerrar}
        />
      )}
    </div>
  );
}
