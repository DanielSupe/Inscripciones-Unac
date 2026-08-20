import type { EnrollmentStatus } from '@repo/contracts';

/**
 * Cómo se nombra cada estado en la consola.
 *
 * Vive aparte de los componentes porque mezclar constantes y componentes en el
 * mismo archivo rompe la recarga en caliente de React.
 */
export const ESTADO_LABELS: Record<EnrollmentStatus, string> = {
  DRAFT: 'Sin terminar',
  SUBMITTED: 'Enviada',
  UNDER_REVIEW: 'En revisión',
  PENDING_INTERVIEW: 'Espera entrevista',
  INTERVIEW_SCHEDULED: 'Entrevista agendada',
  INTERVIEW_HELD: 'Entrevista realizada',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
};
