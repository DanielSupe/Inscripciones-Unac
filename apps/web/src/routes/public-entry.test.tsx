import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setNotice } from '../lib/notice';
import { PublicHome } from './public-routes';

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@tanstack/react-router');
  return {
    ...actual,
    useRouter: () => ({ navigate: vi.fn() }),
    Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
  };
});

const fetchMock = vi.fn<typeof fetch>();
vi.stubGlobal('fetch', fetchMock);

function renderizar() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <PublicHome />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  fetchMock.mockResolvedValue(
    new Response(JSON.stringify({ status: 'ok', database: 'ok' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  );
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('Pantalla de entrada', () => {
  it('ofrece el ingreso sin tener que navegar a otra pantalla', () => {
    renderizar();

    expect(screen.getByLabelText(/Correo electrónico/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contraseña/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeInTheDocument();
  });

  it('identifica a la plataforma con el logotipo', () => {
    renderizar();

    expect(screen.getByRole('img', { name: 'SION' })).toBeInTheDocument();
  });

  it('muestra el aviso de sesión caducada una sola vez', () => {
    setNotice({ tone: 'info', message: 'Tu sesión caducó. Vuelve a ingresar.' });

    const primera = renderizar();
    expect(screen.getByRole('status')).toHaveTextContent('Tu sesión caducó');
    primera.unmount();

    // Recargar no debe repetir un aviso que ya se dio por leído.
    renderizar();
    expect(screen.queryByText(/Tu sesión caducó/)).not.toBeInTheDocument();
  });

  it('presenta los valores como lectura, no como accesos', () => {
    renderizar();

    const valores = screen.getByRole('region', { name: 'Nuestros valores' });
    expect(within(valores).queryAllByRole('link')).toHaveLength(0);
    expect(within(valores).queryAllByRole('button')).toHaveLength(0);
    expect(within(valores).getByText('Integridad')).toBeInTheDocument();
  });

  it('revela la contraseña y la vuelve a ocultar, diciendo en qué estado está', async () => {
    const user = userEvent.setup();
    renderizar();

    const campo = screen.getByLabelText(/Contraseña/);
    expect(campo).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(campo).toHaveAttribute('type', 'text');

    const ocultar = screen.getByRole('button', { name: 'Ocultar contraseña' });
    expect(ocultar).toHaveAttribute('aria-pressed', 'true');

    await user.click(ocultar);
    expect(campo).toHaveAttribute('type', 'password');
  });

  // La pantalla original ofrece las dos cosas. Aquí no existen, y un control
  // que no hace nada es peor que su ausencia.
  it('no ofrece conservar la sesión ni recuperar la contraseña', () => {
    renderizar();

    expect(screen.queryByLabelText(/Mantenerme conectado/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/olvidado tu contraseña/i)).not.toBeInTheDocument();
  });

  it('el carrusel vacío no aporta controles a la pantalla', () => {
    renderizar();

    expect(screen.queryByRole('button', { name: 'Pieza siguiente' })).not.toBeInTheDocument();
  });
});
