/**
 * Señal de que la sesión dejó de valer a mitad de navegación.
 *
 * La emite únicamente el cliente HTTP, al recibir un 401 de un endpoint que no
 * lo esperaba. Existe para que el cliente HTTP no tenga que importar el router
 * ni el cliente de consultas, que es lo que crearía un ciclo.
 *
 * No la emite un 403: ahí la sesión sigue siendo válida y lo único que falta es
 * permiso. Tampoco la emite consultar la identidad propia sin sesión, porque
 * eso no es una sesión caducada sino no haberla tenido nunca.
 */
type Listener = () => void;

const listeners = new Set<Listener>();

export function onSessionExpired(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifySessionExpired(): void {
  for (const listener of listeners) listener();
}
