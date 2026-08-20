import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ATTACHMENT_TYPES, type Enrollment } from '@repo/contracts';
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
    pendingSteps: ['personal', 'aspiration', 'documents'],
    submittedAt: null,
    rejectionReason: null,
    receipt: null,
    interview: null,
    pastInterviews: [],
    decidedAt: null,
    ...overrides,
  };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('EnrollmentWizard', () => {
  it('tiene tres pasos y no pide datos que ya vienen en un documento', () => {
    renderizar(<EnrollmentWizard enrollment={inscripcion()} />);

    const pasos = screen.getAllByRole('button', { name: /Tus datos|Tu programa|Tus documentos/ });
    expect(pasos).toHaveLength(3);

    // El registro y el puntaje del ICFES los aporta el certificado adjunto.
    expect(screen.queryByLabelText(/ICFES/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/graduación/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Colegio/)).not.toBeInTheDocument();
  });

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

  it('señala el campo inválido y no lo guarda', async () => {
    renderizar(<EnrollmentWizard enrollment={inscripcion({ pendingSteps: ['personal'] })} />);

    await userEvent.type(screen.getByLabelText('Nombres'), 'Ana');
    await userEvent.type(screen.getByLabelText('Apellidos'), 'Pérez');
    await userEvent.type(screen.getByLabelText('Fecha de nacimiento'), '1800-01-01');
    await userEvent.selectOptions(screen.getByLabelText('Sexo'), 'FEMALE');
    await userEvent.type(screen.getByLabelText('Teléfono'), 'no-es-un-telefono');
    await userEvent.type(screen.getByLabelText('Ciudad'), 'Medellín');
    await userEvent.type(screen.getByLabelText('Departamento'), 'Antioquia');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar y continuar' }));

    expect(await screen.findByText('Escribe un teléfono válido')).toBeInTheDocument();

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
    await userEvent.click(screen.getByRole('button', { name: /Tus datos/ }));

    expect(screen.getByLabelText('Nombres')).toBeInTheDocument();
  });

  it('no deja enviar mientras falten pasos', () => {
    renderizar(<EnrollmentWizard enrollment={inscripcion({ pendingSteps: ['documents'] })} />);

    expect(screen.getByRole('button', { name: 'Enviar inscripción' })).toBeDisabled();
    expect(screen.getByText(/Te falta:/)).toBeInTheDocument();
  });

  it('habilita el envío cuando no falta nada', () => {
    renderizar(
      <EnrollmentWizard
        enrollment={inscripcion({
          pendingSteps: [],
          attachments: [
            { type: 'IDENTITY', contentType: 'application/pdf', sizeBytes: 1024, uploadedAt: '' },
            { type: 'ICFES', contentType: 'application/pdf', sizeBytes: 1024, uploadedAt: '' },
            { type: 'DIPLOMA', contentType: 'application/pdf', sizeBytes: 1024, uploadedAt: '' },
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

  // El total venía escrito a mano, así que al añadir el diploma la ficha decía
  // «3 de 2». Se cuenta contra el contrato para que no vuelva a desfasarse.
  it('cuenta los adjuntos contra los que el contrato exige', () => {
    const attachments = ATTACHMENT_TYPES.map((type) => ({
      type,
      contentType: 'application/pdf',
      sizeBytes: 1024,
      uploadedAt: '2026-08-10T00:00:00.000Z',
    }));

    renderizar(<ProcessPanel enrollment={inscripcion({ attachments, pendingSteps: [] })} />);

    const total = ATTACHMENT_TYPES.length;
    expect(screen.getByText(`${total} de ${total} adjuntados`)).toBeInTheDocument();
  });

  // El aspirante tiene que poder saber en qué punto va sin preguntar por otro
  // canal: no hay correo, así que verlo aquí es la única forma de enterarse.
  it('explica cada estado nuevo del proceso, sin dejar ninguno mudo', () => {
    const textos: Record<string, RegExp> = {
      PENDING_INTERVIEW: /pasó a la facultad/i,
      INTERVIEW_SCHEDULED: /Ya tienes fecha/i,
      INTERVIEW_HELD: /ya se realizó/i,
    };

    for (const [status, texto] of Object.entries(textos)) {
      const { unmount } = renderizar(
        <ProcessPanel
          enrollment={inscripcion({
            status: status as Enrollment['status'],
            pendingSteps: [],
          })}
        />,
      );
      expect(screen.getByText(texto)).toBeInTheDocument();
      unmount();
    }
  });

  it('muestra el día y cómo asistir cuando ya hay cita', () => {
    renderizar(
      <ProcessPanel
        enrollment={inscripcion({
          status: 'INTERVIEW_SCHEDULED',
          pendingSteps: [],
          interview: {
            id: 'i1',
            scheduledAt: '2026-09-15T19:30:00.000Z',
            modality: 'ON_SITE',
            location: 'Bloque administrativo, oficina 201',
            meetingUrl: null,
            outcome: null,
          },
        })}
      />,
    );

    expect(screen.getByText(/Bloque administrativo, oficina 201/)).toBeInTheDocument();
    // 19:30 UTC son las 2:30 p. m. en Colombia: se presenta en su hora, no en la
    // del servidor.
    expect(screen.getByText(/2:30/)).toBeInTheDocument();
  });

  it('una entrevista virtual se ofrece como enlace abrible', () => {
    renderizar(
      <ProcessPanel
        enrollment={inscripcion({
          status: 'INTERVIEW_SCHEDULED',
          pendingSteps: [],
          interview: {
            id: 'i1',
            scheduledAt: '2026-09-15T19:30:00.000Z',
            modality: 'VIRTUAL',
            location: null,
            meetingUrl: 'https://reunion.example.com/abc',
            outcome: null,
          },
        })}
      />,
    );

    expect(screen.getByRole('link', { name: /reunion.example.com/ })).toBeInTheDocument();
  });

  it('sin fecha todavía, dice que la espera en vez de dejar el hueco vacío', () => {
    renderizar(
      <ProcessPanel enrollment={inscripcion({ status: 'PENDING_INTERVIEW', pendingSteps: [] })} />,
    );

    expect(screen.getByText(/te asignará la fecha de tu entrevista/i)).toBeInTheDocument();
  });

  it('tras una inasistencia explica que habrá fecha nueva', () => {
    renderizar(
      <ProcessPanel
        enrollment={inscripcion({
          status: 'PENDING_INTERVIEW',
          pendingSteps: [],
          pastInterviews: [
            {
              id: 'i0',
              scheduledAt: '2026-09-01T19:30:00.000Z',
              modality: 'ON_SITE',
              location: 'Oficina 201',
              meetingUrl: null,
              outcome: 'NO_SHOW',
            },
          ],
        })}
      />,
    );

    expect(screen.getByText(/No se registró tu asistencia/i)).toBeInTheDocument();
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
            isOverdue: false,
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
            isOverdue: false,
          },
        })}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Pago verificado');
    });
  });
});
