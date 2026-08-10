import { execFileSync } from 'node:child_process';
import { config as loadDotenv } from 'dotenv';

/**
 * Prepara el esquema de pruebas antes de correr nada.
 *
 * Las pruebas de integración crean y borran cuentas, incluida la de
 * administrador de sistema, de la que el seed garantiza que solo haya una. Si
 * corrieran contra el esquema de desarrollo se llevarían por delante el
 * administrador local, que es exactamente lo que pasó antes de existir esto.
 *
 * El esquema lo crea Prisma sola la primera vez que migra, así que no hay nada
 * que preparar a mano.
 */
export default function setup(): void {
  loadDotenv({ path: '.env', quiet: true });

  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error(
      'Falta TEST_DATABASE_URL en apps/api/.env. Cópiala de .env.example: las pruebas no deben ' +
        'escribir en la base de datos de desarrollo.',
    );
  }

  execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'pipe',
    shell: process.platform === 'win32',
  });
}
