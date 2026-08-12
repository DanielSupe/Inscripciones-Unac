import type { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { redirectIfAuthenticated } from './router';

function contexto(ensureQueryData: () => Promise<unknown>) {
  return { context: { queryClient: { ensureQueryData } as unknown as QueryClient } };
}

describe('redirectIfAuthenticated', () => {
  it('deja pasar a la pantalla pública cuando no hay sesión', async () => {
    await expect(redirectIfAuthenticated(contexto(() => Promise.resolve(null)))).resolves
      .toBeUndefined();
  });

  it('lleva a su zona a quien ya tiene sesión', async () => {
    const sesion = { id: '1', documentType: 'CC', documentNumber: '1', email: 'a@b.co', role: 'ADMIN' };

    await expect(
      redirectIfAuthenticated(contexto(() => Promise.resolve(sesion))),
    ).rejects.toBeDefined();
  });

  // La pantalla pública es la que informa de que el sistema está caído. Si un
  // fallo del API impidiera montarla, el aviso no llegaría nunca.
  it('con el API caído deja ver la pantalla pública en vez de propagar el error', async () => {
    const consulta = vi.fn(() => Promise.reject(new Error('No se pudo contactar con el servidor.')));

    await expect(redirectIfAuthenticated(contexto(consulta))).resolves.toBeUndefined();
    expect(consulta).toHaveBeenCalled();
  });
});
