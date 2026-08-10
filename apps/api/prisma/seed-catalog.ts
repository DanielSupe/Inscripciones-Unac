import type { PrismaClient } from '@prisma/client';

/**
 * Programas académicos ofertados.
 *
 * Se siembran porque no cambian de un semestre a otro y no justifican un CRUD.
 * Sacar uno de oferta se hace poniendo `isActive` en falso, nunca borrándolo:
 * las inscripciones que ya lo eligieron tienen que seguir mostrándolo.
 */
const PROGRAMAS = [
  { code: 'TEO', name: 'Teología' },
  { code: 'ENF', name: 'Enfermería' },
  { code: 'ISI', name: 'Ingeniería de Sistemas' },
  { code: 'ADM', name: 'Administración de Empresas' },
  { code: 'CON', name: 'Contaduría Pública' },
  { code: 'PSI', name: 'Psicología' },
  { code: 'LIC', name: 'Licenciatura en Educación' },
  { code: 'MUS', name: 'Música' },
] as const;

/** Periodo de arranque. El CRUD para crear los siguientes llega en el change 4. */
function periodoInicial() {
  const ahora = new Date();
  const año = ahora.getFullYear();
  const semestre = ahora.getMonth() < 6 ? 1 : 2;

  // Abierto desde hace un mes y hasta dentro de tres, para que quien clone el
  // repositorio encuentre una ventana abierta y pueda inscribirse sin tocar la
  // base de datos.
  const opensAt = new Date(ahora);
  opensAt.setMonth(opensAt.getMonth() - 1);
  const closesAt = new Date(ahora);
  closesAt.setMonth(closesAt.getMonth() + 3);

  return {
    code: `${String(año)}-${String(semestre)}`,
    opensAt,
    closesAt,
    enrollmentFeeAmount: 85_000,
    currency: 'COP',
  };
}

/**
 * Siembra el catálogo académico.
 *
 * Idempotente igual que el resto del seed: reconcilia por el código, que es la
 * identidad estable de programas y periodos.
 */
export async function seedCatalog(prisma: PrismaClient): Promise<void> {
  for (const programa of PROGRAMAS) {
    await prisma.academicProgram.upsert({
      where: { code: programa.code },
      create: { ...programa, isActive: true },
      update: { name: programa.name },
    });
  }

  const periodo = periodoInicial();
  await prisma.academicPeriod.upsert({
    where: { code: periodo.code },
    create: periodo,
    // Las fechas y la tarifa no se pisan al resembrar: si alguien las ajustó,
    // volver a sembrar no debería deshacerlo.
    update: {},
  });

  console.warn(
    `✓ Catálogo listo: ${String(PROGRAMAS.length)} programas · periodo ${periodo.code}`,
  );
}
