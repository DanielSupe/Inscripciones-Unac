import { parseWebEnv } from '@repo/config/web';

/**
 * Configuración del frontend, validada y tipada.
 *
 * Usa el mismo esquema que `vite.config.ts`, así que si la construcción pasó,
 * esto no puede fallar. Existe para que el resto de la aplicación lea valores
 * tipados en vez de tocar `import.meta.env` por su cuenta.
 */
export const config = parseWebEnv(import.meta.env, 'apps/web/.env (bundle)');
