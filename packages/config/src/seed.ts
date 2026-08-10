import { seedEnvSchema, type SeedEnv } from './schemas';
import { formatEnvError } from './format';

/**
 * Configuración del seed, validada al importar este módulo.
 *
 * Falla antes de abrir siquiera la conexión a la base de datos, de modo que una
 * siembra mal configurada no deje nada escrito a medias.
 */
function loadSeedEnv(): SeedEnv {
  const result = seedEnvSchema.safeParse(process.env);

  if (!result.success) {
    console.error(formatEnvError(result.error, 'apps/api/.env (siembra)'));
    process.exit(1);
  }

  return result.data;
}

export const seedEnv: SeedEnv = loadSeedEnv();
export type { SeedEnv };
