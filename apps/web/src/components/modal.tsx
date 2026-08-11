import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Ventana modal.
 *
 * Existe porque un formulario que aparece al pie de la página no responde al
 * clic: el contenido queda fuera de la vista y la acción se siente rota. Una
 * capa por encima responde donde estaban los ojos.
 *
 * Y ser modal tiene obligaciones que a medias son peores que no serlo, así que
 * están todas aquí, en un solo sitio, en vez de repetidas en cada pantalla:
 * el foco entra y queda atrapado, el fondo deja de desplazarse, se cierra con
 * Escape o pulsando fuera, y el foco vuelve a lo que la abrió.
 */
export function Modal({
  label,
  actions,
  onClose,
  size = 'normal',
  children,
}: {
  /** Nombre de la ventana para lectores de pantalla y cabecera. */
  label: string;
  /** Controles extra en la cabecera, junto al botón de cerrar. */
  actions?: ReactNode;
  onClose: () => void;
  size?: 'normal' | 'wide';
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

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
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])',
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

  return createPortal(
    <div className="modal-fondo" onClick={onClose}>
      <div
        ref={panelRef}
        className={`modal modal--${size}`}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        // Pulsar dentro no debe cerrar; solo el fondo.
        onClick={(e) => { e.stopPropagation(); }}
      >
        <header className="modal__barra">
          <p className="modal__titulo">{label}</p>
          <div className="modal__acciones">
            {actions}
            <button type="button" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </header>

        <div className="modal__cuerpo">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
