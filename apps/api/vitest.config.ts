import { config as loadDotenv } from 'dotenv';
import { defineConfig } from 'vitest/config';

loadDotenv({ path: '.env', quiet: true });

// Las pruebas apuntan a su propio esquema, nunca al de desarrollo: crean y
// borran cuentas, incluida la de administrador de sistema.
const testDatabaseUrl = process.env.TEST_DATABASE_URL ?? '';

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: ['./vitest.global-setup.ts'],
    env: {
      DATABASE_URL: testDatabaseUrl,
      NODE_ENV: 'test',
    },
    // Las pruebas que arrancan el proceso o tocan la base de datos no pueden
    // pisarse entre sí.
    fileParallelism: false,
    testTimeout: 30_000,
  },
});
