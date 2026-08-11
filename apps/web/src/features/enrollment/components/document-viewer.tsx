import { useEffect, useState } from 'react';
import { ATTACHMENT_TYPE_LABELS, type Attachment, type AttachmentType } from '@repo/contracts';
import { apiFetch } from '../../../lib/http';

/**
 * Visor de un documento adjunto.
 *
 * Pide la dirección firmada al abrirse y la usa dentro de la página. Antes esto
 * era un enlace directo al endpoint que **devuelve** esa dirección, así que el
 * navegador mostraba el JSON en vez del archivo.
 *
 * Se firma al abrir y no antes: cada dirección vive pocos minutos, y firmarlas
 * al pintar una lista gastaría el plazo de documentos que nadie va a mirar.
 *
 * La dirección nunca se enseña. Vive aquí dentro y muere al cerrar.
 */
export function DocumentViewer({
  enrollmentId,
  attachment,
  onClose,
}: {
  enrollmentId: string;
  attachment: Attachment;
  onClose: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;

    void (async () => {
      try {
        const respuesta = await apiFetch<{ url: string }>(
          `/enrollments/${enrollmentId}/documents/${attachment.type}/url`,
        );
        if (vigente) setUrl(respuesta.url);
      } catch {
        if (vigente) setError('No se pudo abrir el documento. Inténtalo de nuevo.');
      }
    })();

    return () => {
      vigente = false;
    };
  }, [enrollmentId, attachment.type]);

  // Cerrar con Escape: es un visor a pantalla parcial, y esperar el botón sería
  // hacerle perder tiempo a quien revisa veinte documentos seguidos.
  useEffect(() => {
    function alPulsar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', alPulsar);
    return () => {
      window.removeEventListener('keydown', alPulsar);
    };
  }, [onClose]);

  const esImagen = attachment.contentType.startsWith('image/');
  const esPdf = attachment.contentType === 'application/pdf';

  return (
    <div className="visor" role="dialog" aria-modal="true" aria-label={ATTACHMENT_TYPE_LABELS[attachment.type]}>
      <header className="visor__barra">
        <div>
          <p className="visor__titulo">{ATTACHMENT_TYPE_LABELS[attachment.type]}</p>
          <p className="visor__meta">
            {(attachment.sizeBytes / 1024).toFixed(0)} KB ·{' '}
            {esPdf ? 'PDF' : esImagen ? 'Imagen' : attachment.contentType}
          </p>
        </div>

        <div className="visor__acciones">
          {url && (
            <a className="boton" href={url} download target="_blank" rel="noopener">
              Descargar
            </a>
          )}
          <button type="button" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </header>

      <div className="visor__lienzo">
        {error && (
          <p className="aviso-caja aviso-caja--error" role="alert">
            {error}
          </p>
        )}

        {!error && !url && (
          <p role="status" className="visor__cargando">
            Abriendo el documento…
          </p>
        )}

        {url && esPdf && (
          <iframe className="visor__marco" src={url} title={ATTACHMENT_TYPE_LABELS[attachment.type]} />
        )}

        {url && esImagen && (
          <img className="visor__imagen" src={url} alt={ATTACHMENT_TYPE_LABELS[attachment.type]} />
        )}

        {/* Un tipo que el navegador no sabe pintar: se ofrece la descarga en
            lugar de un marco en blanco. */}
        {url && !esPdf && !esImagen && (
          <p className="visor__cargando">
            Este tipo de archivo no se puede previsualizar. Descárgalo para verlo.
          </p>
        )}
      </div>
    </div>
  );
}

/** Estado compartido por las pantallas que abren el visor. */
export function useDocumentViewer() {
  const [abierto, setAbierto] = useState<AttachmentType | null>(null);
  return {
    abierto,
    abrir: (type: AttachmentType) => { setAbierto(type); },
    cerrar: () => { setAbierto(null); },
  };
}
