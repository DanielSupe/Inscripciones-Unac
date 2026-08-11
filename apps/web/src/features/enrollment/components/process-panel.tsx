import { Link } from '@tanstack/react-router';
import type { Enrollment, EnrollmentStatus } from '@repo/contracts';
import { ATTACHMENT_TYPES, ENROLLMENT_STEP_LABELS } from '@repo/contracts';
import { useReopenEnrollment } from '../api/enrollment-queries';

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
