import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Attachment } from '@repo/contracts';
import { DocumentViewer } from './document-viewer';

const fetchMock = vi.fn<typeof fetch>();
vi.stubGlobal('fetch', fetchMock);

const URL_FIRMADA = 'https://bucket.example/enrollments/e1/IDENTITY?X-Amz-Signature=abc123';

function renderizar(ui: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

function responde(status: number, body: unknown): Response {
  return { ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) } as Response;
}

function adjunto(overrides: Partial<Attachment> = {}): Attachment {
  return {
    type: 'IDENTITY',
    contentType: 'application/pdf',
    sizeBytes: 204_800,
    uploadedAt: '2026-08-10T00:00:00.000Z',
    ...overrides,
  };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('DocumentViewer', () => {
  it('pide la dirección firmada al abrirse, no antes', async () => {
    fetchMock.mockResolvedValue(responde(200, { url: URL_FIRMADA }));

    renderizar(<DocumentViewer enrollmentId="e1" attachment={adjunto()} onClose={vi.fn()} />);

    expect(await screen.findByRole('link', { name: 'Descargar' })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/enrollments/e1/documents/IDENTITY/url'),
      expect.anything(),
    );
  });

  it('muestra un PDF en un marco, sin enseñar la dirección firmada', async () => {
    // El defecto que este visor corrige era exactamente eso: el navegador
    // mostraba la dirección en JSON en lugar del documento.
    fetchMock.mockResolvedValue(responde(200, { url: URL_FIRMADA }));

    const { container } = renderizar(
      <DocumentViewer enrollmentId="e1" attachment={adjunto()} onClose={vi.fn()} />,
    );

    await screen.findByRole('link', { name: 'Descargar' });
    expect(container.querySelector('iframe')).toHaveAttribute('src', URL_FIRMADA);
    expect(screen.queryByText(URL_FIRMADA)).not.toBeInTheDocument();
    expect(screen.queryByText(/X-Amz-Signature/)).not.toBeInTheDocument();
  });

  it('muestra una imagen como imagen', async () => {
    fetchMock.mockResolvedValue(responde(200, { url: URL_FIRMADA }));

    renderizar(
      <DocumentViewer
        enrollmentId="e1"
        attachment={adjunto({ contentType: 'image/jpeg' })}
        onClose={vi.fn()}
      />,
    );

    expect(await screen.findByRole('img')).toHaveAttribute('src', URL_FIRMADA);
  });

  it('ofrece descargar cuando el tipo no se puede representar', async () => {
    fetchMock.mockResolvedValue(responde(200, { url: URL_FIRMADA }));

    renderizar(
      <DocumentViewer
        enrollmentId="e1"
        attachment={adjunto({ contentType: 'application/octet-stream' })}
        onClose={vi.fn()}
      />,
    );

    expect(await screen.findByText(/no se puede previsualizar/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Descargar' })).toBeInTheDocument();
  });

  it('explica el fallo cuando no se puede obtener el documento', async () => {
    // Es lo que ocurre si el documento no es tuyo: el API responde 404 y aquí
    // no se distingue de cualquier otro fallo, que es lo correcto.
    fetchMock.mockResolvedValue(
      responde(404, { error: { code: 'NOT_FOUND', message: 'No encontramos esa inscripción.' } }),
    );

    renderizar(<DocumentViewer enrollmentId="ajena" attachment={adjunto()} onClose={vi.fn()} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo abrir el documento');
    expect(screen.queryByRole('link', { name: 'Descargar' })).not.toBeInTheDocument();
  });

  it('se cierra con el botón', async () => {
    const onClose = vi.fn();
    fetchMock.mockResolvedValue(responde(200, { url: URL_FIRMADA }));

    renderizar(<DocumentViewer enrollmentId="e1" attachment={adjunto()} onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('se cierra con Escape', async () => {
    const onClose = vi.fn();
    fetchMock.mockResolvedValue(responde(200, { url: URL_FIRMADA }));

    renderizar(<DocumentViewer enrollmentId="e1" attachment={adjunto()} onClose={onClose} />);

    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });
});
