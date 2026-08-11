import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ATTACHMENT_TYPE_LABELS, type Attachment } from '@repo/contracts';
import { apiFetch } from '../../../lib/http';

/**
 * Visor de un documento adjunto, en ventana modal.
 *
 * Pide la dirección firmada al abrirse y la usa dentro de la página. Antes esto
 * era un enlace directo al endpoint que **devuelve** esa dirección, así que el
 * navegador mostraba el JSON en vez del archivo.
 *
 * Va en modal y no en el flujo de la página por un motivo concreto: al pie del
 * documento, abrirlo no parecía hacer nada —el contenido quedaba fuera de la
 * vista y la acción se sentía rota—. Una capa por encima responde al clic donde
 * estaban los ojos.
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
  const panelRef = useRef<HTMLDivElement>(null);

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

  /**
   * Comportamiento de ventana modal: el foco entra, no se escapa mientras está
   * abierta, y vuelve al botón que la abrió. Sin esto, quien navega con teclado
   * seguiría tabulando por la página de detrás sin ver dónde está.
   */
  useEffect(() => {
    const abridor = document.activeElement as HTMLElement | null;
    const scrollPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    function alPulsar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') {
        onClose();
        return;
      }
      if (evento.key !== 'Tab') return;

      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) return;

      const primero = focusables[0];
      const ultimo = focusables[focusables.length - 1];
      if (!primero || !ultimo) return;

      if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primero.focus();
      }
    }

    window.addEventListener('keydown', alPulsar);
    return () => {
      window.removeEventListener('keydown', alPulsar);
      document.body.style.overflow = scrollPrevio;
      abridor?.focus();
    };
  }, [onClose]);

  const esImagen = attachment.contentType.startsWith('image/');
  const esPdf = attachment.contentType === 'application/pdf';
  const titulo = ATTACHMENT_TYPE_LABELS[attachment.type];

  return createPortal(
    <div
      className="visor-fondo"
      // Pulsar fuera cierra, que es lo que espera cualquiera con una ventana
      // encima. El panel detiene la propagación para que pulsar dentro no.
      onClick={onClose}
    >
      <div
        ref={panelRef}
        className="visor"
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
        onClick={(e) => { e.stopPropagation(); }}
      >
        <header className="visor__barra">
          <div>
            <p className="visor__titulo">{titulo}</p>
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
      </div>
    </div>,
    document.body,
  );
}

