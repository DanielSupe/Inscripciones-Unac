/**
 * Aviso de un solo uso para mostrar en la pantalla siguiente.
 *
 * Sirve para los dos casos en que una pantalla necesita explicar por qué
 * llegaste a ella: «tu sesión caducó» y «tu cuenta quedó creada». Se consume al
 * leerlo, de modo que recargar la página no repita un mensaje que ya no viene a
 * cuento.
 *
 * Es un almacén y nada más: no avisa a nadie. Quien tiene que reaccionar a una
 * sesión caducada se entera por `session-expiry`, que es una señal distinta —
 * confundir las dos haría que crear una cuenta borrase la caché.
 */
export type NoticeTone = 'info' | 'exito';

export interface Notice {
  tone: NoticeTone;
  message: string;
}

let pending: Notice | null = null;

export function setNotice(notice: Notice): void {
  pending = notice;
}

export function consumeNotice(): Notice | null {
  const current = pending;
  pending = null;
  return current;
}
