import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiRequestError, apiFetch } from './http';
import { consumeNotice } from './notice';
import { onSessionExpired } from './session-expiry';

const fetchMock = vi.fn<typeof fetch>();
vi.stubGlobal('fetch', fetchMock);

function respuesta(status: number, body: unknown): Response {
  return { ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) } as Response;
}

afterEach(() => {
  vi.clearAllMocks();
  consumeNotice();
});

describe('apiFetch', () => {
  it('envía credenciales para que la cookie viaje entre dominios', async () => {
    fetchMock.mockResolvedValue(respuesta(200, { ok: true }));

    await apiFetch('/algo');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/algo'),
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('traduce el error del API al contrato compartido', async () => {
    fetchMock.mockResolvedValue(
      respuesta(409, { error: { code: 'CONFLICT', message: 'Ya existe.' } }),
    );

    await expect(apiFetch('/algo')).rejects.toMatchObject({
      code: 'CONFLICT',
      status: 409,
      message: 'Ya existe.',
    });
  });

  it('avisa de sesión caducada ante un 401 inesperado', async () => {
    const escucha = vi.fn();
    const cancelar = onSessionExpired(escucha);
    fetchMock.mockResolvedValue(
      respuesta(401, { error: { code: 'UNAUTHORIZED', message: 'Sin sesión.' } }),
    );

    await expect(apiFetch('/algo')).rejects.toBeInstanceOf(ApiRequestError);

    expect(escucha).toHaveBeenCalledOnce();
    expect(consumeNotice()?.message).toContain('Tu sesión caducó');
    cancelar();
  });

  it('NO avisa ante un 403: la sesión sigue valiendo, solo falta permiso', async () => {
    // Expulsar a alguien al ingreso por pedir algo que no le toca sería
    // mentirle sobre qué pasó.
    const escucha = vi.fn();
    const cancelar = onSessionExpired(escucha);
    fetchMock.mockResolvedValue(
      respuesta(403, { error: { code: 'FORBIDDEN', message: 'Sin permiso.' } }),
    );

    await expect(apiFetch('/algo')).rejects.toMatchObject({ code: 'FORBIDDEN' });

    expect(escucha).not.toHaveBeenCalled();
    expect(consumeNotice()).toBeNull();
    cancelar();
  });

  it('NO avisa cuando el endpoint acepta el 401 explícitamente', async () => {
    // Es el caso de consultar la identidad propia sin sesión: no es una sesión
    // caducada, es no haberla tenido nunca.
    const escucha = vi.fn();
    const cancelar = onSessionExpired(escucha);
    fetchMock.mockResolvedValue(
      respuesta(401, { error: { code: 'UNAUTHORIZED', message: 'Sin sesión.' } }),
    );

    await apiFetch('/auth/me', { acceptStatuses: [401] });

    expect(escucha).not.toHaveBeenCalled();
    expect(consumeNotice()).toBeNull();
    cancelar();
  });

  it('convierte una red caída en un error legible', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(apiFetch('/algo')).rejects.toMatchObject({
      code: 'SERVICE_UNAVAILABLE',
      status: 0,
    });
  });
});
