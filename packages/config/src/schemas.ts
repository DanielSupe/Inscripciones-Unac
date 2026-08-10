import { z } from 'zod';
import { documentTypeSchema } from '@repo/contracts';

/**
 * Configuración que necesita el API para atender peticiones.
 *
 * Solo lleva default lo que vale igual en todos los entornos. `DATABASE_URL` y
 * `CORS_ORIGIN` cambian en cada despliegue, así que son obligatorias: un
 * default ahí es la forma más rápida de que producción arranque apuntando a
 * otro sitio sin que nadie se entere.
 */
export const apiEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce
    .number({ message: 'debe ser un número de puerto' })
    .int({ message: 'debe ser un número entero' })
    .positive({ message: 'debe ser mayor que 0' })
    .max(65535, { message: 'debe ser como mucho 65535' })
    .default(3000),
  DATABASE_URL: z.url({ message: 'debe ser una URL de conexión a PostgreSQL' }),
  CORS_ORIGIN: z.url({ message: 'debe ser el origen exacto del frontend, por ejemplo http://localhost:5173' }),
  HEALTH_DB_TIMEOUT_MS: z.coerce
    .number({ message: 'debe ser un número de milisegundos' })
    .int({ message: 'debe ser un número entero' })
    .positive({ message: 'debe ser mayor que 0' })
    .default(2000),
  BCRYPT_ROUNDS: z.coerce
    .number({ message: 'debe ser un número entero' })
    .int({ message: 'debe ser un número entero' })
    .min(4, { message: 'debe ser al menos 4; por debajo el cifrado es inútil' })
    .max(15, { message: 'debe ser como mucho 15; por encima el login tarda segundos' })
    .default(12),
});
export type ApiEnv = z.infer<typeof apiEnvSchema>;

/**
 * Configuración que solo necesita el seed.
 *
 * Va aparte del esquema del API a propósito: el servidor en producción no tiene
 * por qué conocer las credenciales del administrador original para arrancar, y
 * exigírselas sería obligar a que ese secreto viva en el entorno del servicio
 * web pudiendo vivir solo donde se ejecuta la siembra.
 */
export const seedEnvSchema = z.object({
  DATABASE_URL: z.url({ message: 'debe ser una URL de conexión a PostgreSQL' }),
  BCRYPT_ROUNDS: z.coerce
    .number({ message: 'debe ser un número entero' })
    .int({ message: 'debe ser un número entero' })
    .min(4, { message: 'debe ser al menos 4; por debajo el cifrado es inútil' })
    .max(15, { message: 'debe ser como mucho 15; por encima el login tarda segundos' })
    .default(12),
  SEED_ADMIN_DOCUMENT_TYPE: documentTypeSchema,
  SEED_ADMIN_DOCUMENT_NUMBER: z
    .string()
    .min(5, { message: 'debe tener al menos 5 caracteres' })
    .regex(/^[0-9A-Za-z-]+$/, { message: 'solo admite letras, números y guiones' }),
  SEED_ADMIN_EMAIL: z.email({ message: 'debe ser un correo válido' }),
  SEED_ADMIN_PASSWORD: z.string().min(8, { message: 'debe tener al menos 8 caracteres' }),
});
export type SeedEnv = z.infer<typeof seedEnvSchema>;

/**
 * Configuración del frontend.
 *
 * Vite la resuelve en tiempo de construcción, así que este esquema se aplica en
 * dos momentos con el mismo objeto: en `vite.config.ts` para que falle el build,
 * y sobre `import.meta.env` para obtener el valor tipado en ejecución.
 */
export const webEnvSchema = z.object({
  VITE_API_URL: z.url({ message: 'debe ser la URL base del API, por ejemplo http://localhost:3000' }),
});
export type WebEnv = z.infer<typeof webEnvSchema>;
