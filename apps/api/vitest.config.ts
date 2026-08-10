import { config as loadDotenv } from 'dotenv';
import { defineConfig } from 'vitest/config';

// Las pruebas de integración (siembra) necesitan DATABASE_URL. Cargarlo aquí
// evita que dependan de que la shell tenga el entorno exportado a mano.
loadDotenv({ path: '.env', quiet: true });

export default defineConfig({
  test: {
    environment: 'node',
    // Las pruebas que arrancan el proceso o tocan la base de datos no pueden
    // pisarse entre sí.
    fileParallelism: false,
    testTimeout: 30_000,
  },
});
