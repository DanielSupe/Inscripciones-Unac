import { useSyncExternalStore } from 'react';

const CONSULTA = '(prefers-reduced-motion: reduce)';

/** `matchMedia` no existe en todos los entornos donde se monta este código. */
function disponible(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function';
}

function suscribir(alCambiar: () => void): () => void {
  if (!disponible()) return () => undefined;

  const consulta = window.matchMedia(CONSULTA);
  consulta.addEventListener('change', alCambiar);
  return () => { consulta.removeEventListener('change', alCambiar); };
}

function leer(): boolean {
  return disponible() && window.matchMedia(CONSULTA).matches;
}

/**
 * Si el sistema pide reducir el movimiento.
 *
 * Se suscribe en vez de leerlo una sola vez: la preferencia puede activarse con
 * la página ya abierta, y quien la activa lo hace justo porque algo se está
 * moviendo delante.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(suscribir, leer, () => false);
}
