import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginForm } from './login-form';
import { RegisterForm } from './register-form';
import { consumeNotice, setNotice } from '../../../lib/notice';

const navigate = vi.hoisted(() => vi.fn(() => Promise.resolve()));
vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@tanstack/react-router');
  return {
    ...actual,
    useRouter: () => ({ navigate }),
    Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
  };
});

const fetchMock = vi.fn<typeof fetch>();
vi.stubGlobal('fetch', fetchMock);

function renderizar(ui: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

function respuesta(status: number, body: unknown): Response {
  return { ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) } as Response;
}

beforeEach(() => {
  consumeNotice();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('LoginForm', () => {
  it('muestra el aviso pendiente de sesión caducada', () => {
    setNotice({ tone: 'info', message: 'Tu sesión caducó. Vuelve a ingresar.' });

    renderizar(<LoginForm />);

    expect(screen.getByRole('status')).toHaveTextContent('Tu sesión caducó');
  });

  it('consume el aviso, de modo que no reaparece al volver a montar', () => {
    setNotice({ tone: 'exito', message: 'Tu cuenta quedó creada. Ya puedes ingresar.' });

    const primera = renderizar(<LoginForm />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    primera.unmount();

    renderizar(<LoginForm />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('muestra el mensaje neutro del servidor ante credenciales incorrectas', async () => {
    fetchMock.mockResolvedValue(
      respuesta(401, {
        error: { code: 'UNAUTHORIZED', message: 'El correo o la contraseña no son correctos.' },
      }),
    );

    renderizar(<LoginForm />);
    await userEvent.type(screen.getByLabelText(/Correo electrónico/), 'alguien@test.com');
    await userEvent.type(screen.getByLabelText(/Contraseña/), 'equivocada');
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El correo o la contraseña no son correctos.',
    );
  });

  it('lleva a la zona del rol tras ingresar', async () => {
    fetchMock.mockResolvedValue(
      respuesta(200, {
        id: '1',
        documentType: 'CC',
        documentNumber: '123456',
        email: 'admin@test.com',
        role: 'ADMIN',
      }),
    );

    renderizar(<LoginForm />);
    await userEvent.type(screen.getByLabelText(/Correo electrónico/), 'admin@test.com');
    await userEvent.type(screen.getByLabelText(/Contraseña/), 'contrasena123');
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith({ to: '/admin' });
    });
  });
});

describe('RegisterForm', () => {
  it('señala el campo cuando los dos correos no coinciden, sin llamar al API', async () => {
    renderizar(<RegisterForm />);

    await userEvent.type(screen.getByLabelText('Número de documento'), '1234567890');
    await userEvent.type(screen.getByLabelText('Correo electrónico'), 'uno@test.com');
    await userEvent.type(screen.getByLabelText('Confirma tu correo'), 'otro@test.com');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'contrasena123');
    await userEvent.click(screen.getByLabelText(/Acepto las/));
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(await screen.findByText('Los dos correos no coinciden')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('exige aceptar las políticas', async () => {
    renderizar(<RegisterForm />);

    await userEvent.type(screen.getByLabelText('Número de documento'), '1234567890');
    await userEvent.type(screen.getByLabelText('Correo electrónico'), 'uno@test.com');
    await userEvent.type(screen.getByLabelText('Confirma tu correo'), 'uno@test.com');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'contrasena123');
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(
      await screen.findByText('Debes aceptar las políticas de tratamiento de datos'),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('deja un aviso y lleva al ingreso tras crear la cuenta', async () => {
    fetchMock.mockResolvedValue(
      respuesta(201, {
        id: '1',
        documentType: 'CC',
        documentNumber: '1234567890',
        email: 'uno@test.com',
        role: 'APPLICANT',
      }),
    );

    renderizar(<RegisterForm />);
    await userEvent.type(screen.getByLabelText('Número de documento'), '1234567890');
    await userEvent.type(screen.getByLabelText('Correo electrónico'), 'uno@test.com');
    await userEvent.type(screen.getByLabelText('Confirma tu correo'), 'uno@test.com');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'contrasena123');
    await userEvent.click(screen.getByLabelText(/Acepto las/));
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith({ to: '/' });
    });
    expect(consumeNotice()?.message).toContain('Tu cuenta quedó creada');
  });

  it('muestra el mensaje neutro del servidor si la identidad ya está en uso', async () => {
    fetchMock.mockResolvedValue(
      respuesta(409, {
        error: {
          code: 'CONFLICT',
          message: 'No fue posible crear la cuenta con los datos indicados.',
        },
      }),
    );

    renderizar(<RegisterForm />);
    await userEvent.type(screen.getByLabelText('Número de documento'), '1234567890');
    await userEvent.type(screen.getByLabelText('Correo electrónico'), 'uno@test.com');
    await userEvent.type(screen.getByLabelText('Confirma tu correo'), 'uno@test.com');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'contrasena123');
    await userEvent.click(screen.getByLabelText(/Acepto las/));
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No fue posible crear la cuenta con los datos indicados.',
    );
  });
});
