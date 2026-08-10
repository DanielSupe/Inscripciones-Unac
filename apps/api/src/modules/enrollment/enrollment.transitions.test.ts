import { describe, expect, it } from 'vitest';
import type { EnrollmentStatus } from '@repo/contracts';
import { ENROLLMENT_STATUSES } from '@repo/contracts';
import {
  ENROLLMENT_ACTIONS,
  applyTransition,
  canTransition,
  isEditable,
} from './enrollment.transitions';

/** Las transiciones que el proceso admite. Todo lo demás debe rechazarse. */
const PERMITIDAS: ReadonlyArray<[EnrollmentStatus, (typeof ENROLLMENT_ACTIONS)[number], EnrollmentStatus]> = [
  ['DRAFT', 'submit', 'SUBMITTED'],
  ['SUBMITTED', 'takeForReview', 'UNDER_REVIEW'],
  ['SUBMITTED', 'approve', 'APPROVED'],
  ['SUBMITTED', 'reject', 'REJECTED'],
  ['UNDER_REVIEW', 'approve', 'APPROVED'],
  ['UNDER_REVIEW', 'reject', 'REJECTED'],
  ['REJECTED', 'reopen', 'DRAFT'],
];

describe('máquina de estados de la inscripción', () => {
  it.each(PERMITIDAS)('permite %s --%s--> %s', (from, action, to) => {
    expect(applyTransition(from, action)).toBe(to);
  });

  it('rechaza cualquier combinación que no esté prevista', () => {
    // Se recorre el producto completo de estados por acciones, de modo que
    // añadir un estado nuevo sin decidir sus transiciones haga fallar esto.
    const permitidas = new Set(PERMITIDAS.map(([from, action]) => `${from}:${action}`));
    let comprobadas = 0;

    for (const from of ENROLLMENT_STATUSES) {
      for (const action of ENROLLMENT_ACTIONS) {
        if (permitidas.has(`${from}:${action}`)) continue;
        comprobadas += 1;
        expect(canTransition(from, action)).toBe(false);
        expect(() => applyTransition(from, action)).toThrow();
      }
    }

    expect(comprobadas).toBe(ENROLLMENT_STATUSES.length * ENROLLMENT_ACTIONS.length - PERMITIDAS.length);
  });

  it('no deja saltar de diligenciando a aprobada', () => {
    expect(() => applyTransition('DRAFT', 'approve')).toThrow(/en revisión/);
  });

  it('no deja reabrir una inscripción aprobada', () => {
    expect(() => applyTransition('APPROVED', 'reopen')).toThrow(/rechazada/);
  });

  it('no deja enviar dos veces', () => {
    expect(() => applyTransition('SUBMITTED', 'submit')).toThrow();
  });

  it('solo es editable mientras está en borrador', () => {
    expect(isEditable('DRAFT')).toBe(true);
    for (const status of ENROLLMENT_STATUSES.filter((s) => s !== 'DRAFT')) {
      expect(isEditable(status)).toBe(false);
    }
  });
});
