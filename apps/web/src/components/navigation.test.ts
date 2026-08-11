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

  it('ya no queda ninguna sección pendiente', () => {
    // Esta prueba nació afirmando lo contrario: que había opciones en gris
    // marcadas como «pronto» mientras el producto se construía. Ahora todas
    // tienen destino, y lo que hay que vigilar es que siga siendo así: una
    // opción sin destino a estas alturas es un enlace roto, no una promesa.
    const sinDestino = Object.values(NAV_BY_ROLE)
      .flat()
      .filter((item) => item.to === undefined);

    expect(sinDestino).toEqual([]);
  });

  it('ningún destino se repite dentro del mismo rol', () => {
    for (const role of ROLES) {
      const destinos = NAV_BY_ROLE[role].map((item) => item.to);
      expect(new Set(destinos).size).toBe(destinos.length);
    }
  });
});
