import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { parseDatabaseUrl } from '../src/shared/database/connection';
import bcrypt from 'bcrypt';
import { seedEnv } from '@repo/config/seed';
import { seedCatalog } from './seed-catalog';

// El seed corre fuera de la aplicación, así que abre su propia conexión con la
// configuración de siembra en vez de reutilizar el cliente del API.
const adapter = new PrismaPg({ connectionString: seedEnv.DATABASE_URL }, { schema: parseDatabaseUrl(seedEnv.DATABASE_URL).schema });
const prisma = new PrismaClient({ adapter });

/**
 * Crea la cuenta de administrador original.
 *
 * Es idempotente: identifica la cuenta por su documento y reconcilia correo y
 * contraseña sobre ella. Volver a ejecutarlo nunca deja dos administradores.
 */
async function seedInitialAdmin(): Promise<void> {
  const {
    SEED_ADMIN_DOCUMENT_TYPE,
    SEED_ADMIN_DOCUMENT_NUMBER,
    SEED_ADMIN_EMAIL,
    SEED_ADMIN_PASSWORD,
    BCRYPT_ROUNDS,
  } = seedEnv;

  // Si ya hay una cuenta de sistema con OTRO documento, la identidad del admin
  // original cambió después de haber sembrado. Continuar crearía un segundo
  // administrador y rompería la garantía de que existe exactamente uno, así que
  // se aborta sin escribir nada.
  const existingSystemAdmin = await prisma.user.findFirst({
    where: { isSystem: true },
    select: { documentType: true, documentNumber: true, email: true },
  });

  if (
    existingSystemAdmin &&
    (existingSystemAdmin.documentType !== SEED_ADMIN_DOCUMENT_TYPE ||
      existingSystemAdmin.documentNumber !== SEED_ADMIN_DOCUMENT_NUMBER)
  ) {
    throw new Error(
      [
        '',
        '✗ Conflicto de identidad del administrador original.',
        '',
        `  Ya existe una cuenta de sistema con documento ${existingSystemAdmin.documentType} ${existingSystemAdmin.documentNumber},`,
        `  pero la configuración pide ${SEED_ADMIN_DOCUMENT_TYPE} ${SEED_ADMIN_DOCUMENT_NUMBER}.`,
        '',
        '  El documento es la identidad por la que el seed reconoce esta cuenta, así que',
        '  sembrar ahora crearía un segundo administrador. No se ha escrito nada.',
        '',
        '  Si de verdad quieres cambiarlo, decide una de estas dos:',
        '    · Devuelve SEED_ADMIN_DOCUMENT_* a los valores de la cuenta existente.',
        '    · Reinicia la base de datos con `pnpm --filter @repo/api db:reset`.',
        '',
      ].join('\n'),
    );
  }

  const passwordHash = await bcrypt.hash(SEED_ADMIN_PASSWORD, BCRYPT_ROUNDS);

  const admin = await prisma.user.upsert({
    where: {
      documentType_documentNumber: {
        documentType: SEED_ADMIN_DOCUMENT_TYPE,
        documentNumber: SEED_ADMIN_DOCUMENT_NUMBER,
      },
    },
    create: {
      documentType: SEED_ADMIN_DOCUMENT_TYPE,
      documentNumber: SEED_ADMIN_DOCUMENT_NUMBER,
      email: SEED_ADMIN_EMAIL,
      passwordHash,
      role: 'ADMIN',
      isSystem: true,
    },
    update: {
      // Correo y contraseña se reconcilian; el rol y la marca de sistema se
      // reafirman por si alguien los tocó a mano en la base de datos.
      email: SEED_ADMIN_EMAIL,
      passwordHash,
      role: 'ADMIN',
      isSystem: true,
      deletedAt: null,
    },
    select: { id: true, email: true, documentType: true, documentNumber: true },
  });

  console.warn(
    `✓ Administrador original listo: ${admin.email} (${admin.documentType} ${admin.documentNumber})`,
  );
}

async function main(): Promise<void> {
  await seedInitialAdmin();
  await seedCatalog(prisma);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
