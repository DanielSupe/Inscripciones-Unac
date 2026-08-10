import { apiErrorSchema, type ApiErrorCode } from '@repo/contracts';
import { config } from './config';
import { setNotice } from './notice';
import { notifySessionExpired } from './session-expiry';

/** Error de una llamada al API, ya normalizado al contrato compartido. */
export class ApiRequestError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;

  constructor(status: number, code: ApiErrorCode, message: string) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
  }
}

interface ApiFetchOptions extends RequestInit {
  /**
   * Códigos que este endpoint concreto NO considera error.
   *
   * `/health` responde 503 a propósito cuando la base de datos está caída: para
   * un supervisor externo eso es un fallo, pero para nosotros es el dato que
   * fuimos a buscar.
   */
  acceptStatuses?: readonly number[];
}

/**
 * Único punto del frontend que habla con el API.
 *
 * Los componentes nunca llaman `fetch` directo: la URL base, las credenciales
 * de sesión y la traducción del error se resuelven aquí una sola vez. La regla
 * la hace cumplir ESLint.
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { acceptStatuses = [], headers, ...init } = options;

  let response: Response;
  try {
    response = await fetch(`${config.VITE_API_URL}${path}`, {
      ...init,
      // El backend vive en otro dominio; sin esto la cookie de sesión no viaja.
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...headers },
    });
  } catch {
    // Red caída o servidor apagado: no hay respuesta que interpretar.
    throw new ApiRequestError(
      0,
      'SERVICE_UNAVAILABLE',
      'No se pudo contactar con el servidor. Revisa tu conexión e inténtalo de nuevo.',
    );
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok && !acceptStatuses.includes(response.status)) {
    // Un 401 que este endpoint no esperaba significa que la sesión dejó de
    // valer a mitad de navegación. Se avisa para que el arranque limpie la
    // caché y lleve a la pantalla de ingreso explicando por qué.
    //
    // La consulta de identidad propia acepta el 401 explícitamente, así que
    // entrar sin sesión no dispara esto: no es una sesión caducada, es no
    // haberla tenido nunca.
    //
    // Un 403 tampoco lo dispara: la sesión sigue siendo válida y expulsar a
    // alguien por pedir algo que no le toca sería mentirle.
    if (response.status === 401) {
      setNotice({ tone: 'info', message: 'Tu sesión caducó. Vuelve a ingresar.' });
      notifySessionExpired();
    }

    const parsed = apiErrorSchema.safeParse(payload);
    if (parsed.success) {
      throw new ApiRequestError(response.status, parsed.data.error.code, parsed.data.error.message);
    }
    throw new ApiRequestError(
      response.status,
      'INTERNAL_ERROR',
      'El servidor respondió de una forma inesperada.',
    );
  }

  return payload as T;
}
