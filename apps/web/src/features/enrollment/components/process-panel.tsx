import { Link } from '@tanstack/react-router';
import type { Enrollment, EnrollmentStatus } from '@repo/contracts';
import { ATTACHMENT_TYPES, ENROLLMENT_STEP_LABELS } from '@repo/contracts';
import { useReopenEnrollment } from '../api/enrollment-queries';
import { InterviewCard } from './interview-card';

/** Qué significa cada estado para quien lo está mirando, no para el sistema. */
const EXPLICACION: Record<EnrollmentStatus, { titulo: string; texto: string; tono: string }> = {
  DRAFT: {
    titulo: 'Sin terminar',
    texto: 'Todavía no has enviado tu inscripción. Puedes retomarla donde la dejaste.',
    tono: 'info',
  },
  SUBMITTED: {
    titulo: 'Enviada',
    texto: 'Tu inscripción fue enviada y está a la espera de revisión. No tienes que hacer nada por ahora.',
    tono: 'ok',
  },
  UNDER_REVIEW: {
    titulo: 'En revisión',
    texto: 'Estamos revisando tu inscripción y tus documentos. Te avisaremos del resultado aquí mismo.',
    tono: 'ok',
  },
  PENDING_INTERVIEW: {
    titulo: 'Documentos y pago conformes',
    texto:
      'Tu inscripción pasó a la facultad. El decano te asignará fecha para una entrevista y la verás aquí.',
    tono: 'ok',
  },
  INTERVIEW_SCHEDULED: {
    titulo: 'Entrevista agendada',
    texto: 'Ya tienes fecha. Abajo están el día, la hora y cómo asistir.',
    tono: 'ok',
  },
  INTERVIEW_HELD: {
    titulo: 'Entrevista realizada',
    texto: 'Tu entrevista ya se realizó. La facultad está decidiendo y te lo diremos aquí mismo.',
    tono: 'ok',
  },
  APPROVED: {
    titulo: 'Aprobada',
    texto: '¡Felicitaciones! Tu inscripción fue aprobada.',
    tono: 'ok',
  },
  REJECTED: {
    titulo: 'Rechazada',
    texto: 'Tu inscripción fue rechazada. Puedes corregir lo señalado y volver a enviarla.',
    tono: 'error',
  },
};

export function ProcessPanel({ enrollment }: { enrollment: Enrollment }) {
  const reopen = useReopenEnrollment(enrollment.id);
  const estado = EXPLICACION[enrollment.status];

  return (
    <>
      <h1>Mi proceso</h1>
      <p className="subtitulo">Periodo {enrollment.period.code}</p>

      <div className={`estado estado--${estado.tono === 'error' ? 'error' : estado.tono === 'ok' ? 'ok' : 'degradado'}`} role="status">
        <p>
          <strong>{estado.titulo}</strong>
        </p>
        <p>{estado.texto}</p>
      </div>

      {enrollment.status === 'REJECTED' && enrollment.rejectionReason && (
        <div className="aviso-caja aviso-caja--error" role="alert">
          <strong>Motivo:</strong> {enrollment.rejectionReason}
        </div>
      )}

      {enrollment.status === 'REJECTED' && (
        <button type="button" onClick={() => void reopen.mutateAsync()} disabled={reopen.isPending}>
          {reopen.isPending ? 'Abriendo…' : 'Corregir y reenviar'}
        </button>
      )}

      {enrollment.status === 'DRAFT' && (
        <>
          {enrollment.pendingSteps.length > 0 && (
            <p>
              Te falta completar:{' '}
              {enrollment.pendingSteps.map((s) => ENROLLMENT_STEP_LABELS[s]).join(', ')}.
            </p>
          )}
          <Link to="/aspirante/inscripcion" className="boton boton--primario">
            Continuar mi inscripción
          </Link>
        </>
      )}

      {enrollment.interview && (
        <section aria-labelledby="titulo-entrevista">
          <h2 id="titulo-entrevista">Tu entrevista</h2>
          <InterviewCard interview={enrollment.interview} />
        </section>
      )}

      {/* Sin cita en pie pero ya en la facultad: decirlo evita que el silencio
          se lea como un trámite olvidado. */}
      {!enrollment.interview && enrollment.status === 'PENDING_INTERVIEW' && (
        <p className="cita__espera">
          {enrollment.pastInterviews.length > 0
            ? 'No se registró tu asistencia a la entrevista. La facultad te asignará una fecha nueva.'
            : 'La facultad te asignará la fecha de tu entrevista. La verás aquí en cuanto la fijen.'}
        </p>
      )}

      <dl className="ficha">
        <dt>Programa</dt>
        <dd>{enrollment.program?.name ?? 'Sin elegir'}</dd>
        <dt>Documentos</dt>
        <dd>
          {enrollment.attachments.length} de {ATTACHMENT_TYPES.length} adjuntados
        </dd>
        {enrollment.submittedAt && (
          <>
            <dt>Enviada el</dt>
            <dd>{new Date(enrollment.submittedAt).toLocaleDateString('es-CO')}</dd>
          </>
        )}
      </dl>

      {enrollment.receipt && (
        <p>
          <Link to="/aspirante/recibo">Ver mi recibo de pago</Link>
        </p>
      )}
    </>
  );
}
