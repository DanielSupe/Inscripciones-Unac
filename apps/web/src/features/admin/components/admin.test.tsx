import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Enrollment, ManagedUser, Paged, ReviewItem } from '@repo/contracts';
import { UsersTable } from './users-table';
import { ReviewInbox } from './review-inbox';
import { ReviewDetail } from './review-detail';

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

function renderizar(ui: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

function responde(body: unknown): Response {
  return { ok: true, status: 200, json: () => Promise.resolve(body) } as Response;
}

const ADMIN_ID = 'admin-1';

function cuenta(overrides: Partial<ManagedUser> = {}): ManagedUser {
  return {
    id: 'u1',
    documentType: 'CC',
    documentNumber: '1234567890',
    email: 'aspirante@test.com',
    role: 'APPLICANT',
    isSystem: false,
    createdAt: '2026-08-01T00:00:00.000Z',
    deletedAt: null,
    ...overrides,
  };
}

function pagina<T>(items: T[]): Paged<T> {
  return { items, total: items.length, page: 1, pageSize: 20 };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('UsersTable', () => {
  it('muestra las cuentas con su rol', async () => {
    fetchMock.mockResolvedValue(responde(pagina([cuenta()])));

    renderizar(<UsersTable sessionUserId={ADMIN_ID} />);

    expect(await screen.findByText('aspirante@test.com')).toBeInTheDocument();
    // Acotado a la tabla: «Aspirante» aparece también en el filtro por rol.
    expect(within(screen.getByRole('table')).getByText('Aspirante')).toBeInTheDocument();
  });

  it('no ofrece eliminar la cuenta de sistema', async () => {
    fetchMock.mockResolvedValue(
      responde(pagina([cuenta({ email: 'admin@unac.edu.co', role: 'ADMIN', isSystem: true })])),
    );

    renderizar(<UsersTable sessionUserId={ADMIN_ID} />);

    await screen.findByText('admin@unac.edu.co');
    expect(screen.queryByRole('button', { name: 'Eliminar' })).not.toBeInTheDocument();
    // Sí ofrece restablecerle la contraseña: protegerla de eso la dejaría inservible.
    expect(screen.getByRole('button', { name: 'Contraseña' })).toBeInTheDocument();
  });

  it('no ofrece eliminar la propia cuenta', async () => {
    fetchMock.mockResolvedValue(responde(pagina([cuenta({ id: ADMIN_ID, role: 'ADMIN' })])));

    renderizar(<UsersTable sessionUserId={ADMIN_ID} />);

    await screen.findByText('aspirante@test.com');
    expect(screen.queryByRole('button', { name: 'Eliminar' })).not.toBeInTheDocument();
  });

  it('sí ofrece eliminar a los demás', async () => {
    fetchMock.mockResolvedValue(responde(pagina([cuenta()])));

    renderizar(<UsersTable sessionUserId={ADMIN_ID} />);

    expect(await screen.findByRole('button', { name: 'Eliminar' })).toBeInTheDocument();
  });
});

describe('ReviewInbox', () => {
  function item(overrides: Partial<ReviewItem> = {}): ReviewItem {
    return {
      id: 'e1',
      status: 'SUBMITTED',
      applicantName: 'Ana Pérez',
      applicantDocument: 'CC 1234567890',
      applicantEmail: 'ana@test.com',
      applicantDeleted: false,
      programName: 'Enfermería',
      periodCode: '2026-2',
      submittedAt: '2026-08-01T00:00:00.000Z',
      paymentStatus: 'PENDING',
      paymentOverdue: false,
      ...overrides,
    };
  }

  it('distingue un pago vencido de uno pendiente', async () => {
    fetchMock.mockResolvedValue(responde(pagina([item({ paymentOverdue: true })])));

    renderizar(<ReviewInbox />);

    expect(await screen.findByText('Vencido')).toBeInTheDocument();
  });

  it('señala cuando la cuenta del aspirante fue eliminada', async () => {
    // La inscripción sobrevive al borrado lógico; quien revisa necesita saberlo.
    fetchMock.mockResolvedValue(responde(pagina([item({ applicantDeleted: true })])));

    renderizar(<ReviewInbox />);

    expect(await screen.findByText('cuenta eliminada')).toBeInTheDocument();
  });
});

describe('ReviewDetail', () => {
  function inscripcion(overrides: Partial<Enrollment> = {}): Enrollment {
    return {
      id: 'e1',
      status: 'SUBMITTED',
      program: { id: 'p1', code: 'ENF', name: 'Enfermería' },
      period: {
        id: 'per1',
        code: '2026-2',
        opensAt: '2026-07-01T00:00:00.000Z',
        closesAt: '2026-11-01T00:00:00.000Z',
        enrollmentFeeAmount: 85000,
        currency: 'COP',
      },
      data: { firstName: 'Ana', lastName: 'Pérez' },
      attachments: [],
      pendingSteps: [],
      submittedAt: '2026-08-01T00:00:00.000Z',
      rejectionReason: null,
      receipt: {
        receiptNumber: '2026-2-000001',
        amount: 85000,
        currency: 'COP',
        issuedAt: '2026-08-01T00:00:00.000Z',
        dueAt: '2026-08-16T00:00:00.000Z',
        status: 'PENDING',
        isOverdue: false,
      },
      ...overrides,
    };
  }

  it('deshabilita aprobar mientras el pago siga pendiente, y lo explica', async () => {
    fetchMock.mockResolvedValue(responde(inscripcion()));

    renderizar(<ReviewDetail enrollmentId="e1" />);

    expect(await screen.findByRole('button', { name: 'Aprobar' })).toBeDisabled();
    expect(screen.getByText('No se puede aprobar hasta verificar el pago.')).toBeInTheDocument();
  });

  it('habilita aprobar cuando el pago está verificado', async () => {
    fetchMock.mockResolvedValue(
      responde(
        inscripcion({
          receipt: { ...inscripcion().receipt!, status: 'VERIFIED' },
        }),
      ),
    );

    renderizar(<ReviewDetail enrollmentId="e1" />);

    expect(await screen.findByRole('button', { name: 'Aprobar' })).toBeEnabled();
  });

  it('no deja rechazar con un motivo demasiado corto', async () => {
    fetchMock.mockResolvedValue(responde(inscripcion()));

    renderizar(<ReviewDetail enrollmentId="e1" />);

    // Sin escribir nada, el botón está deshabilitado.
    expect(await screen.findByRole('button', { name: 'Rechazar' })).toBeDisabled();
  });

  it('no ofrece decidir sobre una inscripción ya resuelta', async () => {
    fetchMock.mockResolvedValue(responde(inscripcion({ status: 'APPROVED' })));

    renderizar(<ReviewDetail enrollmentId="e1" />);

    await screen.findByText(/Aprobada/);
    expect(screen.queryByRole('button', { name: 'Aprobar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Rechazar' })).not.toBeInTheDocument();
  });
});
