import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Enrollment } from '@repo/contracts';
import { EnrollmentWizard } from './enrollment-wizard';
import { ProcessPanel } from './process-panel';
import { ReceiptPanel } from './receipt-panel';

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

const PERIODO = {
  id: 'p1',
  code: '2026-2',
  opensAt: '2026-07-01T00:00:00.000Z',
  closesAt: '2026-11-01T00:00:00.000Z',
  enrollmentFeeAmount: 85000,
  currency: 'COP',
};

function inscripcion(overrides: Partial<Enrollment> = {}): Enrollment {
  return {
    id: 'e1',
    status: 'DRAFT',
    program: null,
    period: PERIODO,
    data: {},
    attachments: [],
    pendingSteps: ['personal', 'academic', 'aspiration', 'documents'],
    submittedAt: null,
    rejectionReason: null,
    receipt: null,
    ...overrides,
  };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('EnrollmentWizard', () => {
  it('abre en el primer paso pendiente, no siempre en el primero', () => {
    // Personal y académico ya están; debe abrirse en aspiración.
    renderizar(
      <EnrollmentWizard enrollment={inscripcion({ pendingSteps: ['aspiration', 'documents'] })} />,
    );

    expect(screen.getByLabelText('Programa académico')).toBeInTheDocument();
  });

  it('muestra los datos ya guardados al retomar', () => {
    renderizar(
      <EnrollmentWizard
        enrollment={inscripcion({
          pendingSteps: ['personal'],
          data: { firstName: 'Ana', lastName: 'Pérez', city: 'Medellín' },
        })}
      />,
    );

    expect(screen.getByLabelText('Nombres')).toHaveValue('Ana');
    expect(screen.getByLabelText('Ciudad')).toHaveValue('Medellín');
  });

  it('señala el campo inválido y no llama al API', async () => {
    renderizar(<EnrollmentWizard enrollment={inscripcion({ pendingSteps: ['academic'] })} />);

    await userEvent.type(screen.getByLabelText('Colegio de origen'), 'Colegio X');
    await userEvent.type(screen.getByLabelText('Año de graduación'), '2099');
    await userEvent.type(screen.getByLabelText('Número de registro ICFES'), 'AC202100001');
    await userEvent.type(screen.getByLabelText('Puntaje global ICFES'), '350');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar y continuar' }));

    expect(
      await screen.findByText('El año de graduación no puede estar en el futuro'),
    ).toBeInTheDocument();

    // El wizard sí consulta el catálogo al montarse; lo que no debe ocurrir es
    // el guardado, así que se comprueba eso y no que no hubiera red en absoluto.
    const guardados = fetchMock.mock.calls.filter(
      ([, init]) => (init as RequestInit | undefined)?.method === 'PATCH',
    );
    expect(guardados).toHaveLength(0);
  });

  it('marca los pasos completados y deja navegar entre ellos', async () => {
    renderizar(<EnrollmentWizard enrollment={inscripcion({ pendingSteps: ['documents'] })} />);

    // Estando en documentos, se puede volver a un paso ya completo.
    await userEvent.click(screen.getByRole('button', { name: /Datos personales/ }));

    expect(screen.getByLabelText('Nombres')).toBeInTheDocument();
  });

  it('no deja enviar mientras falten pasos', () => {
    renderizar(<EnrollmentWizard enrollment={inscripcion({ pendingSteps: ['documents'] })} />);

    expect(screen.getByRole('button', { name: 'Enviar inscripción' })).toBeDisabled();
    expect(screen.getByText(/Para enviar te falta/)).toBeInTheDocument();
  });

  it('habilita el envío cuando no falta nada', () => {
    renderizar(
      <EnrollmentWizard
        enrollment={inscripcion({
          pendingSteps: [],
          attachments: [
            { type: 'IDENTITY', contentType: 'application/pdf', sizeBytes: 1024, uploadedAt: '' },
            { type: 'ICFES', contentType: 'application/pdf', sizeBytes: 1024, uploadedAt: '' },
          ],
        })}
      />,
    );

    expect(screen.getByRole('button', { name: 'Enviar inscripción' })).toBeEnabled();
  });
});

describe('ProcessPanel', () => {
  it('explica que está en revisión', () => {
    renderizar(<ProcessPanel enrollment={inscripcion({ status: 'SUBMITTED', pendingSteps: [] })} />);

    expect(screen.getByRole('status')).toHaveTextContent('Enviada');
    expect(screen.getByText(/a la espera de revisión/)).toBeInTheDocument();
  });

  it('muestra el motivo del rechazo y ofrece corregir', () => {
    renderizar(
      <ProcessPanel
        enrollment={inscripcion({
          status: 'REJECTED',
          pendingSteps: [],
          rejectionReason: 'La foto del documento es ilegible.',
        })}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('La foto del documento es ilegible.');
    expect(screen.getByRole('button', { name: 'Corregir y reenviar' })).toBeInTheDocument();
  });

  it('en borrador dice qué falta y ofrece continuar', () => {
    renderizar(<ProcessPanel enrollment={inscripcion({ pendingSteps: ['documents'] })} />);

    expect(screen.getByText(/Te falta completar/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Continuar mi inscripción' })).toBeInTheDocument();
  });

  it('celebra la aprobación', () => {
    renderizar(<ProcessPanel enrollment={inscripcion({ status: 'APPROVED', pendingSteps: [] })} />);

    expect(screen.getByRole('status')).toHaveTextContent('Aprobada');
  });
});

describe('ReceiptPanel', () => {
  it('explica que el recibo llega al enviar, si todavía no hay', () => {
    renderizar(<ReceiptPanel enrollment={inscripcion()} />);

    expect(screen.getByRole('status')).toHaveTextContent('se emite cuando termines');
  });

  it('muestra el recibo con su valor y su vencimiento', () => {
    renderizar(
      <ReceiptPanel
        enrollment={inscripcion({
          status: 'SUBMITTED',
          pendingSteps: [],
          receipt: {
            receiptNumber: '2026-2-000001',
            amount: 85000,
            currency: 'COP',
            issuedAt: '2026-08-10T00:00:00.000Z',
            dueAt: '2026-08-25T00:00:00.000Z',
            status: 'PENDING',
          },
        })}
      />,
    );

    expect(screen.getByText('2026-2-000001')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Pago pendiente');
    expect(screen.getByRole('link', { name: 'Descargar en PDF' })).toHaveAttribute(
      'href',
      expect.stringContaining('/enrollments/e1/receipt.pdf'),
    );
  });

  it('cambia el mensaje cuando el pago ya se verificó', async () => {
    renderizar(
      <ReceiptPanel
        enrollment={inscripcion({
          status: 'SUBMITTED',
          pendingSteps: [],
          receipt: {
            receiptNumber: '2026-2-000001',
            amount: 85000,
            currency: 'COP',
            issuedAt: '2026-08-10T00:00:00.000Z',
            dueAt: '2026-08-25T00:00:00.000Z',
            status: 'VERIFIED',
          },
        })}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Pago verificado');
    });
  });
});
