import { describe, expect, it } from 'vitest';
import { ROLES } from '@repo/contracts';
import { NAV_BY_ROLE, ROLE_LABELS } from './navigation';
import { homePathFor } from '../features/auth/api/auth-queries';

describe('menú lateral', () => {
  it('define opciones y etiqueta para los tres roles', () => {
    for (const role of ROLES) {
      expect(NAV_BY_ROLE[role].length).toBeGreaterThan(0);
      expect(ROLE_LABELS[role]).toBeTruthy();
    }
  });

  it('la primera opción de cada rol lleva a su zona de inicio', () => {
    for (const role of ROLES) {
      expect(NAV_BY_ROLE[role][0]?.to).toBe(homePathFor(role));
    }
  });

  it('cada rol tiene una zona de inicio distinta', () => {
    const destinos = ROLES.map((role) => homePathFor(role));
    expect(new Set(destinos).size).toBe(ROLES.length);
  });

  it('las opciones sin destino son las que aún no existen', () => {
    // No es un descuido: se listan a propósito, en gris, para que se vea la
    // diferencia entre roles antes de que las secciones existan.
    const pendientes = Object.values(NAV_BY_ROLE)
      .flat()
      .filter((item) => item.to === undefined);

    expect(pendientes.length).toBeGreaterThan(0);
    for (const item of pendientes) {
      expect(item.label).toBeTruthy();
    }
  });
});
