import { afterEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

process.env.DATABASE_URL ??= 'postgresql://sion:sion@localhost:5432/sion';
process.env.CORS_ORIGIN ??= 'http://localhost:5173';

const getHealthStatus = vi.hoisted(() =>
  vi.fn<() => Promise<{ status: 'ok' | 'degraded'; database: 'ok' | 'unreachable' }>>(),
);
vi.mock('./health.service', () => ({ getHealthStatus }));

const { createApp } = await import('../../app');
const app = createApp();

afterEach(() => {
  vi.clearAllMocks();
});

describe('GET /health', () => {
  it('responde 200 cuando el sistema está sano', async () => {
    getHealthStatus.mockResolvedValue({ status: 'ok', database: 'ok' });

    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', database: 'ok' });
  });

  it('responde 503 cuando la base de datos está degradada', async () => {
    // 503 y no 200: los supervisores de los hosts gratuitos deciden sobre el
    // código HTTP y no leen el cuerpo.
    getHealthStatus.mockResolvedValue({ status: 'degraded', database: 'unreachable' });

    const response = await request(app).get('/health');

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ status: 'degraded', database: 'unreachable' });
  });

  it('no filtra host, credenciales ni trazas cuando está degradado', async () => {
    getHealthStatus.mockResolvedValue({ status: 'degraded', database: 'unreachable' });

    const response = await request(app).get('/health');
    const cuerpo = JSON.stringify(response.body);

    for (const prohibido of ['postgresql://', 'localhost', '5432', 'sion', 'at ', 'Error']) {
      expect(cuerpo).not.toContain(prohibido);
    }
  });

  it('es accesible sin ninguna sesión', async () => {
    getHealthStatus.mockResolvedValue({ status: 'ok', database: 'ok' });

    const response = await request(app).get('/health').set('Cookie', '');

    expect(response.status).toBe(200);
  });
});

describe('rutas no montadas', () => {
  it('responden con la forma de error del contrato compartido', async () => {
    const response = await request(app).get('/ruta-que-no-existe');

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({ error: { code: 'NOT_FOUND' } });
    expect(typeof response.body.error.message).toBe('string');
  });
});

describe('errores no controlados', () => {
  it('responden 500 con mensaje genérico y sin traza', async () => {
    getHealthStatus.mockRejectedValue(new Error('fallo interno con detalle sensible'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const response = await request(app).get('/health');

    expect(response.status).toBe(500);
    expect(response.body).toMatchObject({ error: { code: 'INTERNAL_ERROR' } });
    expect(JSON.stringify(response.body)).not.toContain('detalle sensible');
    // El detalle sí se registra en el servidor, que es donde sirve.
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
