import type { EnrollmentStatus } from '@repo/contracts';
import { ConflictError } from '../../shared/errors';

/**
 * Las transiciones que existen, y nada más.
 *
 * Es el único sitio donde se decide si un cambio de estado es legal. El change
 * de la consola de administración llamará a `approve` y `reject` sin volver a
 * escribir ninguna de estas reglas.
 *
 *   DRAFT ──submit──▶ SUBMITTED ──takeForReview──▶ UNDER_REVIEW
 *     ▲                                            │       │
 *     │                                        approve   reject
 *     │                                            ▼       ▼
 *     └────────────── reopen ─────────────── APPROVED   REJECTED
 *                                                          │
 *     ◀────────────────────────────────────────────────────┘
 */
export const ENROLLMENT_ACTIONS = [
  'submit',
  'takeForReview',
  'approve',
  'reject',
  'reopen',
] as const;
export type EnrollmentAction = (typeof ENROLLMENT_ACTIONS)[number];

interface Transition {
  from: readonly EnrollmentStatus[];
  to: EnrollmentStatus;
  /** Qué se le dice a quien la intenta desde un estado que no la admite. */
  rejection: string;
}

const TRANSITIONS: Record<EnrollmentAction, Transition> = {
  submit: {
    from: ['DRAFT'],
    to: 'SUBMITTED',
    rejection: 'Esta inscripción no está en estado de poder enviarse.',
  },
  takeForReview: {
    from: ['SUBMITTED'],
    to: 'UNDER_REVIEW',
    rejection: 'Solo se puede tomar para revisión una inscripción enviada.',
  },
  approve: {
    from: ['SUBMITTED', 'UNDER_REVIEW'],
    to: 'APPROVED',
    rejection: 'Solo se puede aprobar una inscripción que esté en revisión.',
  },
  reject: {
    from: ['SUBMITTED', 'UNDER_REVIEW'],
    to: 'REJECTED',
    rejection: 'Solo se puede rechazar una inscripción que esté en revisión.',
  },
  reopen: {
    from: ['REJECTED'],
    to: 'DRAFT',
    rejection: 'Solo se puede corregir una inscripción que haya sido rechazada.',
  },
};

/** Si la transición es legal desde ese estado. Sin efectos ni excepciones. */
export function canTransition(from: EnrollmentStatus, action: EnrollmentAction): boolean {
  return TRANSITIONS[action].from.includes(from);
}

/**
 * Devuelve el estado resultante, o lanza si la transición no está prevista.
 *
 * Las condiciones que dependen de datos —que la inscripción esté completa, que
 * el periodo siga abierto, que el pago esté verificado— las comprueba el
 * service antes de llamar aquí, porque para saberlas hay que ir a la base de
 * datos y esta función es deliberadamente pura.
 */
export function applyTransition(
  from: EnrollmentStatus,
  action: EnrollmentAction,
): EnrollmentStatus {
  const transition = TRANSITIONS[action];
  if (!transition.from.includes(from)) {
    throw new ConflictError(transition.rejection);
  }
  return transition.to;
}

/** Si el aspirante puede editar sus datos y sus documentos en este estado. */
export function isEditable(status: EnrollmentStatus): boolean {
  return status === 'DRAFT';
}
