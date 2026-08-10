import { webEnvSchema, type WebEnv } from './schemas';
import { formatEnvError } from './format';

/**
 * Valida las variables del frontend y devuelve el objeto tipado.
 *
 * A diferencia de las entradas del servidor, esta no mata el proceso: lanza. En
 * `vite.config.ts` eso rompe la construcción con el mensaje a la vista, que es
 * exactamente lo que queremos que ocurra en el despliegue de Vercel.
 */
export function parseWebEnv(source: Record<string, unknown>, origin: string): WebEnv {
  const result = webEnvSchema.safeParse(source);

  if (!result.success) {
    throw new Error(formatEnvError(result.error, origin));
  }

  return result.data;
}

export { webEnvSchema };
export type { WebEnv };
