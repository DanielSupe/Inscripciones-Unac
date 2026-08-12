import { useEffect, useState, type ReactNode } from 'react';
import { useReducedMotion } from '../lib/use-reduced-motion';

/** Cada cuánto pasa a la pieza siguiente. Da tiempo a leer una sin prisa. */
const INTERVALO_MS = 6000;

export interface CarouselSlide {
  id: string;
  /** Cómo se nombra la pieza para quien no puede verla. */
  label: string;
  content: ReactNode;
}

/**
 * Carrusel de piezas.
 *
 * Nace vacío y eso es su estado normal, no un fallo: mientras no haya piezas
 * ocupa su hueco y no pinta un solo control, porque una flecha que no lleva a
 * ninguna parte se lee como algo roto. Los controles aparecen desde dos piezas,
 * que es cuando por fin hay a dónde ir.
 *
 * El avance automático se detiene con el puntero encima o con el foco dentro, y
 * no arranca si el sistema pide reducir movimiento. Aquí eso importa más de lo
 * habitual: al lado hay un formulario de contraseña, y el movimiento periférico
 * compite con la tarea que de verdad trae a la gente.
 */
export function Carousel({
  slides,
  label,
  intervalMs = INTERVALO_MS,
}: {
  slides: CarouselSlide[];
  label: string;
  intervalMs?: number;
}) {
  const [indiceElegido, setIndice] = useState(0);
  const [detenido, setDetenido] = useState(false);
  const movimientoReducido = useReducedMotion();

  // Si la lista encoge, el índice guardado puede quedar apuntando fuera de
  // ella. Se acota al leerlo en vez de corregirlo con un efecto: un valor
  // derivado no puede quedar desincronizado de aquello de lo que deriva.
  const indice = Math.min(indiceElegido, Math.max(slides.length - 1, 0));

  const hayControles = slides.length > 1;
  const rotando = hayControles && !detenido && !movimientoReducido;

  useEffect(() => {
    if (!rotando) return;

    const temporizador = window.setInterval(() => {
      setIndice((actual) => (actual + 1) % slides.length);
    }, intervalMs);

    return () => { window.clearInterval(temporizador); };
  }, [rotando, slides.length, intervalMs]);

  if (slides.length === 0) {
    return <div className="carrusel carrusel--vacio" />;
  }

  const irA = (destino: number): void => {
    setIndice((destino + slides.length) % slides.length);
  };

  return (
    <div
      className="carrusel"
      role="group"
      aria-roledescription="carrusel"
      aria-label={label}
      onMouseEnter={() => { setDetenido(true); }}
      onMouseLeave={() => { setDetenido(false); }}
      onFocus={() => { setDetenido(true); }}
      onBlur={() => { setDetenido(false); }}
    >
      {/* Mientras rota solo, anunciar cada cambio interrumpiría sin que nadie
          lo haya pedido. Detenido, el cambio sí lo provocó una persona. */}
      <div className="carrusel__vista" aria-live={rotando ? 'off' : 'polite'}>
        {slides.map((slide, posicion) => (
          <div
            key={slide.id}
            className="carrusel__pieza"
            role="group"
            aria-roledescription="pieza"
            aria-label={`${posicion + 1} de ${slides.length}: ${slide.label}`}
            hidden={posicion !== indice}
          >
            {slide.content}
          </div>
        ))}
      </div>

      {hayControles && (
        <div className="carrusel__controles">
          <button
            type="button"
            className="carrusel__flecha"
            aria-label="Pieza anterior"
            onClick={() => { irA(indice - 1); }}
          >
            <span aria-hidden="true">‹</span>
          </button>

          <ul className="carrusel__puntos">
            {slides.map((slide, posicion) => (
              <li key={slide.id}>
                <button
                  type="button"
                  className={`carrusel__punto ${posicion === indice ? 'carrusel__punto--activo' : ''}`}
                  aria-label={`Ir a la pieza ${posicion + 1}`}
                  aria-current={posicion === indice ? 'true' : undefined}
                  onClick={() => { irA(posicion); }}
                />
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="carrusel__flecha"
            aria-label="Pieza siguiente"
            onClick={() => { irA(indice + 1); }}
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>
      )}
    </div>
  );
}
