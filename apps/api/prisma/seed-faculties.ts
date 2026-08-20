import type { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { seedEnv } from '@repo/config/seed';

/**
 * Facultades y sus decanos.
 *
 * PROVISIONAL — el reparto de programas está redactado a la espera de la
 * estructura oficial de la UNAC. Cambiarlo es editar este arreglo y volver a
 * sembrar; los códigos son la identidad estable, así que renombrar una facultad
 * no crea otra.
 *
 * Se siembra antes que el catálogo porque cada programa cuelga de una facultad.
 */
const FACULTADES = [
  { code: 'TEO', name: 'Facultad de Teología', deanName: 'Decanatura de Teología' },
  { code: 'SAL', name: 'Facultad de Ciencias de la Salud', deanName: 'Decanatura de Salud' },
  { code: 'ING', name: 'Facultad de Ingeniería', deanName: 'Decanatura de Ingeniería' },
  {
    code: 'ADM',
    name: 'Facultad de Ciencias Administrativas',
    deanName: 'Decanatura de Ciencias Administrativas',
  },
  { code: 'EDU', name: 'Facultad de Educación y Artes', deanName: 'Decanatura de Educación' },
] as const;

export type FacultyCode = (typeof FACULTADES)[number]['code'];

/** Qué facultad dirige cada programa sembrado. */
export const FACULTAD_DE_PROGRAMA: Record<string, FacultyCode> = {
  TEO: 'TEO',
  ENF: 'SAL',
  PSI: 'SAL',
  ISI: 'ING',
  ADM: 'ADM',
  CON: 'ADM',
  LIC: 'EDU',
  MUS: 'EDU',
};

/** Documento sintético con el que el seed reconoce a cada decano. */
function documentoDeDecano(code: FacultyCode): string {
  return `DEC-${code}`;
}

export async function seedFaculties(prisma: PrismaClient): Promise<void> {
  const { SEED_DEAN_EMAIL_DOMAIN, SEED_DEAN_PASSWORD, BCRYPT_ROUNDS } = seedEnv;
  const passwordHash = await bcrypt.hash(SEED_DEAN_PASSWORD, BCRYPT_ROUNDS);

  for (const facultad of FACULTADES) {
    const email = `decano.${facultad.code.toLowerCase()}@${SEED_DEAN_EMAIL_DOMAIN}`;

    // La contraseña solo se fija al crear. Resembrar no debe deshacer un
    // restablecimiento del administrador: el decano se quedaría fuera sin que
    // nadie entendiera por qué.
    const decano = await prisma.user.upsert({
      where: {
        documentType_documentNumber: {
          documentType: 'CC',
          documentNumber: documentoDeDecano(facultad.code),
        },
      },
      create: {
        documentType: 'CC',
        documentNumber: documentoDeDecano(facultad.code),
        email,
        passwordHash,
        role: 'DEAN',
      },
      update: { role: 'DEAN', deletedAt: null },
      select: { id: true, email: true },
    });

    await prisma.faculty.upsert({
      where: { code: facultad.code },
      create: { code: facultad.code, name: facultad.name, deanUserId: decano.id },
      update: { name: facultad.name, deanUserId: decano.id, isActive: true },
    });
  }

  console.warn(
    `✓ Facultades listas: ${String(FACULTADES.length)}, cada una con su decano ` +
      `(contraseña común: restablécelas desde la consola)`,
  );
}
