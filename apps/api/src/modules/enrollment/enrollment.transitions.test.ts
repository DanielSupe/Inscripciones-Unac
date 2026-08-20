import { describe, expect, it } from 'vitest';
import type { EnrollmentStatus, Role } from '@repo/contracts';
import { ENROLLMENT_STATUSES, ROLES } from '@repo/contracts';
import {
  ENROLLMENT_ACTIONS,
  applyTransition,
  canTransition,
  isEditable,
  rolesFor,
} from './enrollment.transitions';

type Accion = (typeof ENROLLMENT_ACTIONS)[number];

/** Las transiciones que el proceso admite, con el rol que puede provocarlas. */
const PERMITIDAS: ReadonlyArray<[EnrollmentStatus, Accion, Role, EnrollmentStatus]> = [
  ['DRAFT', 'submit', 'APPLICANT', 'SUBMITTED'],
  ['SUBMITTED', 'takeForReview', 'ADMIN', 'UNDER_REVIEW'],
  ['UNDER_REVIEW', 'handOver', 'ADMIN', 'PENDING_INTERVIEW'],
  ['UNDER_REVIEW', 'rejectByAdmin', 'ADMIN', 'REJECTED'],
  ['PENDING_INTERVIEW', 'schedule', 'DEAN', 'INTERVIEW_SCHEDULED'],
  ['PENDING_INTERVIEW', 'rejectByDean', 'DEAN', 'REJECTED'],
  ['INTERVIEW_SCHEDULED', 'reschedule', 'DEAN', 'INTERVIEW_SCHEDULED'],
  ['INTERVIEW_SCHEDULED', 'markHeld', 'DEAN', 'INTERVIEW_HELD'],
  ['INTERVIEW_SCHEDULED', 'markNoShow', 'DEAN', 'PENDING_INTERVIEW'],
  ['INTERVIEW_SCHEDULED', 'rejectByDean', 'DEAN', 'REJECTED'],
  ['INTERVIEW_HELD', 'approve', 'DEAN', 'APPROVED'],
  ['INTERVIEW_HELD', 'rejectByDean', 'DEAN', 'REJECTED'],
  ['REJECTED', 'reopen', 'APPLICANT', 'DRAFT'],
];

describe('máquina de estados de la inscripción', () => {
  it.each(PERMITIDAS)('permite %s --%s (%s)--> %s', (from, action, role, to) => {
    expect(applyTransition(from, action, role)).toBe(to);
  });

  it('rechaza cualquier combinación de estado y acción que no esté prevista', () => {
    // Se recorre el producto completo de estados por acciones, de modo que
    // añadir un estado nuevo sin decidir sus transiciones haga fallar esto.
    const permitidas = new Set(PERMITIDAS.map(([from, action]) => `${from}:${action}`));
    let comprobadas = 0;

    for (const from of ENROLLMENT_STATUSES) {
      for (const action of ENROLLMENT_ACTIONS) {
        if (permitidas.has(`${from}:${action}`)) continue;
        comprobadas += 1;
        expect(canTransition(from, action)).toBe(false);
        // Con el rol correcto, para que lo que falle sea el estado y no el permiso.
        const rol = rolesFor(action)[0] ?? 'ADMIN';
        expect(() => applyTransition(from, action, rol)).toThrow();
      }
    }

    const combinaciones = ENROLLMENT_STATUSES.length * ENROLLMENT_ACTIONS.length;
    expect(comprobadas).toBe(combinaciones - permitidas.size);
  });

  // El reparto de manos es lo que introduce este change, y es la clase de regla
  // que se erosiona en silencio: sin esto, mover `approve` al administrador
  // seguiría pasando todas las demás pruebas.
  it('cada acción la puede provocar solo el rol que le corresponde', () => {
    for (const [from, action, rolPermitido] of PERMITIDAS) {
      for (const rol of ROLES) {
        if (rol === rolPermitido) continue;
        expect(() => applyTransition(from, action, rol)).toThrow(/permiso/i);
      }
    }
  });

  it('el administrador ya no puede aprobar', () => {
    expect(() => applyTransition('INTERVIEW_HELD', 'approve', 'ADMIN')).toThrow(/permiso/i);
  });

  it('el decano no puede entregarse a sí mismo una inscripción', () => {
    expect(() => applyTransition('UNDER_REVIEW', 'handOver', 'DEAN')).toThrow(/permiso/i);
  });

  it('el permiso se comprueba antes que el estado', () => {
    // Un rol sin permiso recibe siempre la misma respuesta, esté la inscripción
    // donde esté: así no puede deducir en qué punto va lo que no es suyo.
    expect(() => applyTransition('DRAFT', 'approve', 'APPLICANT')).toThrow(/permiso/i);
    expect(() => applyTransition('INTERVIEW_HELD', 'approve', 'APPLICANT')).toThrow(/permiso/i);
  });

  it('no deja aprobar sin que la entrevista se haya realizado', () => {
    expect(() => applyTransition('PENDING_INTERVIEW', 'approve', 'DEAN')).toThrow(/entrevista/i);
    expect(() => applyTransition('INTERVIEW_SCHEDULED', 'approve', 'DEAN')).toThrow(/entrevista/i);
  });

  it('no deja agendar antes de que el administrador entregue', () => {
    expect(() => applyTransition('UNDER_REVIEW', 'schedule', 'DEAN')).toThrow(/facultad/i);
  });

  it('una inasistencia devuelve a la espera de entrevista, no rechaza', () => {
    expect(applyTransition('INTERVIEW_SCHEDULED', 'markNoShow', 'DEAN')).toBe('PENDING_INTERVIEW');
  });

  it('no deja reabrir una inscripción aprobada', () => {
    expect(() => applyTransition('APPROVED', 'reopen', 'APPLICANT')).toThrow(/rechazada/);
  });

  it('no deja enviar dos veces', () => {
    expect(() => applyTransition('SUBMITTED', 'submit', 'APPLICANT')).toThrow();
  });

  it('solo es editable mientras está en borrador', () => {
    expect(isEditable('DRAFT')).toBe(true);
    for (const status of ENROLLMENT_STATUSES.filter((s) => s !== 'DRAFT')) {
      expect(isEditable(status)).toBe(false);
    }
  });
});
