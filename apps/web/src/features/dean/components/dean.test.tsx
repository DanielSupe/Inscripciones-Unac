import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Enrollment, EnrollmentStatus } from '@repo/contracts';
import { DeanDetail } from './dean-detail';

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

function responde(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

function renderizar(ui: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

const AYER = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
const MAÑANA = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

function inscripcion(overrides: Partial<Enrollment> = {}): Enrollment {
  return {
    id: 'e1',
    status: 'PENDING_INTERVIEW',
    program: {
      id: 'p1',
      code: 'ENF',
      name: 'Enfermería',
      faculty: { id: 'f1', code: 'SAL', name: 'Facultad de Ciencias de la Salud' },
    },
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
    receipt: null,
    interview: null,
    pastInterviews: [],
    decidedAt: null,
    ...overrides,
  };
}

const CITA = {
  id: 'i1',
  scheduledAt: MAÑANA,
  modality: 'ON_SITE' as const,
  location: 'Bloque administrativo, oficina 201',
  meetingUrl: null,
  outcome: null,
};

afterEach(() => {
  vi.clearAllMocks();
});

describe('DeanDetail', () => {
  it('sin cita ofrece agendar', async () => {
    fetchMock.mockResolvedValue(responde(inscripcion()));

    renderizar(<DeanDetail enrollmentId="e1" />);

    expect(await screen.findByRole('button', { name: 'Agendar entrevista' })).toBeInTheDocument();
  });

  // Es la regla central del change: sin entrevista realizada no hay decisión.
  it('no deja decidir mientras la entrevista no conste realizada', async () => {
    for (const status of ['PENDING_INTERVIEW', 'INTERVIEW_SCHEDULED'] as const) {
      fetchMock.mockResolvedValue(responde(inscripcion({ status, interview: CITA })));

      const { unmount } = renderizar(<DeanDetail enrollmentId="e1" />);

      expect(await screen.findByRole('button', { name: 'Aprobar' })).toBeDisabled();
      expect(
        screen.getByText(/Solo puedes decidir cuando la entrevista conste realizada/),
      ).toBeInTheDocument();
      unmount();
    }
  });

  it('habilita aprobar con la entrevista realizada', async () => {
    fetchMock.mockResolvedValue(
      responde(
        inscripcion({
          status: 'INTERVIEW_HELD',
          pastInterviews: [{ ...CITA, scheduledAt: AYER, outcome: 'HELD' }],
        }),
      ),
    );

    renderizar(<DeanDetail enrollmentId="e1" />);

    expect(await screen.findByRole('button', { name: 'Aprobar' })).toBeEnabled();
  });

  // Declarar realizada una cita futura convertiría el registro en una ficción.
  it('no deja declarar el resultado antes de la hora de la cita', async () => {
    fetchMock.mockResolvedValue(
      responde(inscripcion({ status: 'INTERVIEW_SCHEDULED', interview: CITA })),
    );

    renderizar(<DeanDetail enrollmentId="e1" />);

    expect(await screen.findByRole('button', { name: 'Se realizó' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'No se presentó' })).toBeDisabled();
  });

  it('deja declarar el resultado una vez pasada la hora', async () => {
    fetchMock.mockResolvedValue(
      responde(
        inscripcion({
          status: 'INTERVIEW_SCHEDULED',
          interview: { ...CITA, scheduledAt: AYER },
        }),
      ),
    );

    renderizar(<DeanDetail enrollmentId="e1" />);

    expect(await screen.findByRole('button', { name: 'Se realizó' })).toBeEnabled();
  });

  // Sin historial, una segunda ausencia sería solo un recuerdo de quien estuvo
  // delante; con él es un hecho sobre el que se puede decidir.
  it('conserva a la vista las entrevistas cerradas', async () => {
    fetchMock.mockResolvedValue(
      responde(
        inscripcion({
          pastInterviews: [{ ...CITA, id: 'i0', scheduledAt: AYER, outcome: 'NO_SHOW' }],
        }),
      ),
    );

    renderizar(<DeanDetail enrollmentId="e1" />);

    expect(await screen.findByText(/No asistió/)).toBeInTheDocument();
  });

  it('el formulario pide el lugar si es presencial y el enlace si es virtual', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(responde(inscripcion()));

    renderizar(<DeanDetail enrollmentId="e1" />);
    await user.click(await screen.findByRole('button', { name: 'Agendar entrevista' }));

    expect(screen.getByLabelText('Lugar')).toBeInTheDocument();
    expect(screen.queryByLabelText('Enlace de la reunión')).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Modalidad'), 'VIRTUAL');

    expect(screen.getByLabelText('Enlace de la reunión')).toBeInTheDocument();
    expect(screen.queryByLabelText('Lugar')).not.toBeInTheDocument();
  });

  it('no ofrece nada que hacer sobre una inscripción ya resuelta', async () => {
    const resuelta: EnrollmentStatus = 'APPROVED';
    fetchMock.mockResolvedValue(responde(inscripcion({ status: resuelta })));

    renderizar(<DeanDetail enrollmentId="e1" />);

    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByRole('button', { name: 'Aprobar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Agendar entrevista' })).not.toBeInTheDocument();
  });
});
