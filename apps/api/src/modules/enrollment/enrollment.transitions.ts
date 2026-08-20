import type { EnrollmentStatus, Role } from '@repo/contracts';
import { ConflictError, ForbiddenError } from '../../shared/errors';

/**
 * Las transiciones que existen, y nada más.
 *
 * Es el único sitio donde se decide si un cambio de estado es legal y quién
 * puede provocarlo. El proceso pasa por dos manos —el administrador comprueba y
 * entrega, el decano entrevista y decide— y ese reparto se declara aquí en vez
 * de repartirse en condicionales por los servicios.
 *
 *   DRAFT ──submit──▶ SUBMITTED ──takeForReview──▶ UNDER_REVIEW
 *     ▲                                                 │
 *     │                            ┌────rejectByAdmin───┤
 *     │                            │                    │ handOver
 *     │                            ▼                    ▼
 *     │                        REJECTED ◀──────  PENDING_INTERVIEW ◀─┐
 *     │                            ▲                    │           │
 *     │                    rejectByDean            schedule    markNoShow
 *     │                            │                    ▼           │
 *     │                            └────────  INTERVIEW_SCHEDULED ───┘
 *     │                                                 │ markHeld
 *     │                                                 ▼
 *     └────────────── reopen ──────  REJECTED ◀──  INTERVIEW_HELD ──approve──▶ APPROVED
 *
 * Rechazar son dos acciones y no una: el administrador rechaza por un problema
 * de trámite mientras la tiene en revisión, y el decano rechaza por criterio
 * académico una vez cerrada la entrevista. Fundirlas obligaría a que el rol
 * autorizado dependiera del estado de origen, que es justo la clase de regla
 * implícita que este archivo existe para evitar.
 */
export const ENROLLMENT_ACTIONS = [
  'submit',
  'takeForReview',
  'handOver',
  'rejectByAdmin',
  'schedule',
  'reschedule',
  'markHeld',
  'markNoShow',
  'approve',
  'rejectByDean',
  'reopen',
] as const;
export type EnrollmentAction = (typeof ENROLLMENT_ACTIONS)[number];

interface Transition {
  from: readonly EnrollmentStatus[];
  to: EnrollmentStatus;
  /** Quién puede provocarla. El rol sale de la sesión, nunca de la petición. */
  roles: readonly Role[];
  /** Qué se le dice a quien la intenta desde un estado que no la admite. */
  rejection: string;
}

const TRANSITIONS: Record<EnrollmentAction, Transition> = {
  submit: {
    from: ['DRAFT'],
    to: 'SUBMITTED',
    roles: ['APPLICANT'],
    rejection: 'Esta inscripción no está en estado de poder enviarse.',
  },
  takeForReview: {
    from: ['SUBMITTED'],
    to: 'UNDER_REVIEW',
    roles: ['ADMIN'],
    rejection: 'Solo se puede tomar para revisión una inscripción enviada.',
  },
  handOver: {
    from: ['UNDER_REVIEW'],
    to: 'PENDING_INTERVIEW',
    roles: ['ADMIN'],
    rejection: 'Solo se puede entregar a la facultad una inscripción que esté en revisión.',
  },
  rejectByAdmin: {
    from: ['UNDER_REVIEW'],
    to: 'REJECTED',
    roles: ['ADMIN'],
    rejection: 'Solo se puede rechazar por trámite una inscripción que esté en revisión.',
  },
  schedule: {
    from: ['PENDING_INTERVIEW'],
    to: 'INTERVIEW_SCHEDULED',
    roles: ['DEAN'],
    rejection: 'Solo se puede agendar la entrevista de una inscripción que ya esté en la facultad.',
  },
  // Mover una cita no cambia el estado, pero sí tiene un momento en que es
  // legal. Declararlo aquí evita que esa condición viva suelta en el service.
  reschedule: {
    from: ['INTERVIEW_SCHEDULED'],
    to: 'INTERVIEW_SCHEDULED',
    roles: ['DEAN'],
    rejection: 'Solo se puede mover una entrevista que siga agendada.',
  },
  markHeld: {
    from: ['INTERVIEW_SCHEDULED'],
    to: 'INTERVIEW_HELD',
    roles: ['DEAN'],
    rejection: 'Solo se puede dar por realizada una entrevista agendada.',
  },
  markNoShow: {
    from: ['INTERVIEW_SCHEDULED'],
    to: 'PENDING_INTERVIEW',
    roles: ['DEAN'],
    rejection: 'Solo se puede registrar una inasistencia sobre una entrevista agendada.',
  },
  approve: {
    from: ['INTERVIEW_HELD'],
    to: 'APPROVED',
    roles: ['DEAN'],
    rejection: 'Solo se puede aprobar una inscripción cuya entrevista ya se haya realizado.',
  },
  rejectByDean: {
    from: ['PENDING_INTERVIEW', 'INTERVIEW_SCHEDULED', 'INTERVIEW_HELD'],
    to: 'REJECTED',
    roles: ['DEAN'],
    rejection: 'Solo se puede rechazar una inscripción que esté en manos de la facultad.',
  },
  reopen: {
    from: ['REJECTED'],
    to: 'DRAFT',
    roles: ['APPLICANT'],
    rejection: 'Solo se puede corregir una inscripción que haya sido rechazada.',
  },
};

/** Si la transición es legal desde ese estado. Sin efectos ni excepciones. */
export function canTransition(from: EnrollmentStatus, action: EnrollmentAction): boolean {
  return TRANSITIONS[action].from.includes(from);
}

/** Qué roles pueden provocar esta acción. */
export function rolesFor(action: EnrollmentAction): readonly Role[] {
  return TRANSITIONS[action].roles;
}

/**
 * Devuelve el estado resultante, o lanza si la transición no está prevista.
 *
 * El rol se comprueba **antes** que el estado: a quien no está autorizado no se
 * le cuenta en qué punto está una inscripción que no le corresponde.
 *
 * Las condiciones que dependen de datos —que la inscripción esté completa, que
 * el pago esté verificado, que la entrevista ya ocurriera— las comprueba el
 * service antes de llamar aquí, porque para saberlas hay que ir a la base de
 * datos y esta función es deliberadamente pura.
 */
export function applyTransition(
  from: EnrollmentStatus,
  action: EnrollmentAction,
  role: Role,
): EnrollmentStatus {
  const transition = TRANSITIONS[action];

  if (!transition.roles.includes(role)) {
    throw new ForbiddenError('No tienes permiso para hacer esto sobre esta inscripción.');
  }

  if (!transition.from.includes(from)) {
    throw new ConflictError(transition.rejection);
  }

  return transition.to;
}

/** Si el aspirante puede editar sus datos y sus documentos en este estado. */
export function isEditable(status: EnrollmentStatus): boolean {
  return status === 'DRAFT';
}
