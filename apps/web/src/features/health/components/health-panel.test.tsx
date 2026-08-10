import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HealthPanel } from './health-panel';

const fetchMock = vi.fn<typeof fetch>();
vi.stubGlobal('fetch', fetchMock);

function renderizar(): void {
  // Sin reintentos ni caché entre pruebas: cada una parte de cero.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  render(<HealthPanel />, { wrapper: Wrapper });
}

function respuesta(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('HealthPanel', () => {
  it('muestra que está cargando mientras la consulta no termina', () => {
    fetchMock.mockImplementation(() => new Promise<Response>(() => undefined));

    renderizar();

    expect(screen.getByRole('status')).toHaveTextContent('Comprobando el estado del sistema');
  });

  it('muestra el sistema operativo cuando el API responde bien', async () => {
    fetchMock.mockResolvedValue(respuesta(200, { status: 'ok', database: 'ok' }));

    renderizar();

    expect(await screen.findByText(/operativo/)).toBeInTheDocument();
    expect(screen.getByText(/conectada/)).toBeInTheDocument();
  });

  it('muestra degradación cuando el API responde 503', async () => {
    // 503 no es un error de la consulta: es el dato que fuimos a buscar.
    fetchMock.mockResolvedValue(respuesta(503, { status: 'degraded', database: 'unreachable' }));

    renderizar();

    expect(await screen.findByText(/degradado/)).toBeInTheDocument();
    expect(screen.getByText(/inalcanzable/)).toBeInTheDocument();
  });

  it('muestra un error legible cuando el API no responde, no una pantalla en blanco', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    renderizar();

    // El hook reintenta una vez antes de rendirse, así que la alerta tarda más
    // que el tope por defecto de findBy.
    const alerta = await screen.findByRole('alert', {}, { timeout: 5000 });
    expect(alerta).toHaveTextContent('No se pudo consultar el estado del sistema');
    expect(alerta).toHaveTextContent('No se pudo contactar con el servidor');
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });

  it('envía credenciales para que la cookie de sesión viaje entre dominios', async () => {
    fetchMock.mockResolvedValue(respuesta(200, { status: 'ok', database: 'ok' }));

    renderizar();
    await screen.findByText(/operativo/);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/health',
      expect.objectContaining({ credentials: 'include' }),
    );
  });
});
