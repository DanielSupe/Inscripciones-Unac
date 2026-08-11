import { useEffect, useState } from 'react';
import { ATTACHMENT_TYPE_LABELS, type Attachment } from '@repo/contracts';
import { Modal } from '../../../components/modal';
import { apiFetch } from '../../../lib/http';

/**
 * Visor de un documento adjunto.
 *
 * Pide la dirección firmada al abrirse y la usa dentro de la página. Antes esto
 * era un enlace directo al endpoint que **devuelve** esa dirección, así que el
 * navegador mostraba el JSON en vez del archivo.
 *
 * Se firma al abrir y no antes: cada dirección vive pocos minutos, y firmarlas
 * al pintar una lista gastaría el plazo de documentos que nadie va a mirar. La
 * dirección nunca se enseña: vive aquí dentro y muere al cerrar.
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

  const esImagen = attachment.contentType.startsWith('image/');
  const esPdf = attachment.contentType === 'application/pdf';
  const titulo = ATTACHMENT_TYPE_LABELS[attachment.type];

  return (
    <Modal
      label={titulo}
      size="wide"
      onClose={onClose}
      actions={
        url ? (
          <a className="boton" href={url} download target="_blank" rel="noopener">
            Descargar
          </a>
        ) : null
      }
    >
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

        {url && esPdf && <iframe className="visor__marco" src={url} title={titulo} />}

        {url && esImagen && <img className="visor__imagen" src={url} alt={titulo} />}

        {/* Un tipo que el navegador no sabe pintar: se ofrece la descarga en
            lugar de un marco en blanco. */}
        {url && !esPdf && !esImagen && (
          <p className="visor__cargando">
            Este tipo de archivo no se puede previsualizar. Descárgalo para verlo.
          </p>
        )}
      </div>
    </Modal>
  );
}
