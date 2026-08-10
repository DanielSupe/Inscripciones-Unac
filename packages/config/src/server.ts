import { apiEnvSchema, type ApiEnv } from './schemas';
import { formatEnvError } from './format';

/**
 * Configuración del API, validada al importar este módulo.
 *
 * Se importa como primera instrucción del arranque: si el entorno está mal, el
 * proceso muere aquí y no llega a aceptar tráfico. Fallar en el arranque es
 * ruidoso y se ve en los registros del despliegue; fallar a mitad de una
 * petición lo descubre un usuario.
 */
function loadApiEnv(): ApiEnv {
  const result = apiEnvSchema.safeParse(process.env);

  if (!result.success) {
    console.error(formatEnvError(result.error, 'apps/api/.env'));
    process.exit(1);
  }

  return result.data;
}

export const env: ApiEnv = loadApiEnv();
export type { ApiEnv };
