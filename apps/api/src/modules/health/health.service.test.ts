import { afterEach, describe, expect, it, vi } from 'vitest';

// La configuración se importa al cargar el módulo, así que se fija aquí antes
// de que nada la lea.
process.env.DATABASE_URL ??= 'postgresql://sion:sion@localhost:5432/sion';
process.env.CORS_ORIGIN ??= 'http://localhost:5173';
process.env.HEALTH_DB_TIMEOUT_MS = '150';

const pingDatabase = vi.hoisted(() => vi.fn<() => Promise<void>>());
vi.mock('./health.repository', () => ({ pingDatabase }));

const { getHealthStatus } = await import('./health.service');

afterEach(() => {
  vi.clearAllMocks();
});

describe('getHealthStatus', () => {
  it('reporta el sistema operativo cuando la base de datos responde', async () => {
    pingDatabase.mockResolvedValue(undefined);

    await expect(getHealthStatus()).resolves.toEqual({ status: 'ok', database: 'ok' });
  });

  it('reporta degradación cuando la base de datos falla', async () => {
    pingDatabase.mockRejectedValue(new Error('connection refused'));

    await expect(getHealthStatus()).resolves.toEqual({
      status: 'degraded',
      database: 'unreachable',
    });
  });

  it('reporta degradación cuando la base de datos no responde a tiempo', async () => {
    // Ni resuelve ni rechaza: es el caso que deja colgada una comprobación
    // ingenua, y por el que existe el tope de tiempo.
    pingDatabase.mockImplementation(() => new Promise<void>(() => undefined));

    await expect(getHealthStatus()).resolves.toEqual({
      status: 'degraded',
      database: 'unreachable',
    });
  });

  it('no deja el proceso vivo por un temporizador pendiente', async () => {
    pingDatabase.mockResolvedValue(undefined);

    // Si el temporizador de la carrera no se limpiara, este await tardaría lo
    // que dure el tope en vez de resolverse de inmediato.
    const inicio = Date.now();
    await getHealthStatus();
    expect(Date.now() - inicio).toBeLessThan(100);
  });
});
