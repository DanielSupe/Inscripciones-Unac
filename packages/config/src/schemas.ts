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
const apiEnvShape = z.object({
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

  // ─── Sesión ───────────────────────────────────────────────────────────────
  // Sin default a propósito: un secreto de firma por defecto es una firma que
  // cualquiera con el repositorio puede reproducir.
  JWT_SECRET: z
    .string()
    .min(32, { message: 'debe tener al menos 32 caracteres; genera uno aleatorio' }),
  JWT_EXPIRES_IN: z
    .string()
    .regex(/^\d+[smhd]$/, { message: 'debe ser una duración como 2h, 30m o 7d' })
    .default('2h'),
  COOKIE_NAME: z.string().min(1).default('sion_session'),
  COOKIE_SECURE: z
    .enum(['true', 'false'], { message: 'debe ser true o false' })
    .default('false')
    .transform((value) => value === 'true'),
  COOKIE_SAMESITE: z
    .enum(['lax', 'strict', 'none'], { message: 'debe ser lax, strict o none' })
    .default('lax'),

  // ─── Políticas de tratamiento de datos ────────────────────────────────────
  POLICY_VERSION: z.string().min(1, { message: 'identifica la versión vigente, por ejemplo 2026-01' }),

  // ─── Almacenamiento de documentos ─────────────────────────────────────────
  // El bucket guarda documentos de identidad, así que sus credenciales tienen
  // el mismo trato que el secreto de sesión: requeridas y sin valor por defecto.
  S3_REGION: z.string().min(1, { message: 'la región del bucket, por ejemplo us-east-1' }),
  S3_BUCKET: z.string().min(1, { message: 'el nombre del bucket' }),
  S3_ACCESS_KEY_ID: z.string().min(16, { message: 'la credencial del usuario de servicio' }),
  S3_SECRET_ACCESS_KEY: z.string().min(16, { message: 'el secreto del usuario de servicio' }),
  // Vacío con AWS; solo se fija al usar almacenamiento compatible con S3.
  S3_ENDPOINT: z.string().default(''),
  S3_FORCE_PATH_STYLE: z
    .enum(['true', 'false'], { message: 'debe ser true o false' })
    .default('false')
    .transform((value) => value === 'true'),
  S3_PRESIGN_EXPIRES_SECONDS: z.coerce
    .number({ message: 'debe ser un número de segundos' })
    .int({ message: 'debe ser un número entero' })
    .min(30, { message: 'menos de 30 segundos no da tiempo a subir un archivo' })
    .max(3600, { message: 'más de una hora es una ventana innecesariamente amplia' })
    .default(300),
  MAX_UPLOAD_BYTES: z.coerce
    .number({ message: 'debe ser un número de bytes' })
    .int({ message: 'debe ser un número entero' })
    .positive({ message: 'debe ser mayor que 0' })
    .default(5_242_880),

  // ─── Recibo de pago ───────────────────────────────────────────────────────
  RECEIPT_DUE_DAYS: z.coerce
    .number({ message: 'debe ser un número de días' })
    .int({ message: 'debe ser un número entero' })
    .positive({ message: 'debe ser mayor que 0' })
    .default(15),
});

/**
 * Esquema del API, con la comprobación cruzada de los atributos de la cookie.
 *
 * `SameSite=None` sin `Secure` es una combinación que el navegador descarta sin
 * avisar: el ingreso responde bien y la petición siguiente llega sin sesión.
 * Vale mucho más que el proceso no arranque a que alguien lo descubra en
 * producción persiguiendo un fantasma.
 */
export const apiEnvSchema = apiEnvShape.refine(
  (env) => !(env.COOKIE_SAMESITE === 'none' && !env.COOKIE_SECURE),
  {
    message:
      'COOKIE_SAMESITE=none exige COOKIE_SECURE=true; el navegador descarta esa cookie en silencio',
    path: ['COOKIE_SECURE'],
  },
);
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

  // Los decanos se siembran igual que el administrador original. Su correo se
  // compone con el código de la facultad y este dominio, de modo que añadir una
  // facultad no obligue a añadir dos variables más.
  SEED_DEAN_EMAIL_DOMAIN: z
    .string()
    .regex(/^[a-z0-9.-]+\.[a-z]{2,}$/, { message: 'debe ser un dominio, sin arroba ni protocolo' }),
  // Común a todos los decanos sembrados. Es una credencial compartida a
  // conciencia: el administrador debe restablecer cada una tras el primer
  // arranque, con la pantalla que ya existe para eso.
  SEED_DEAN_PASSWORD: z.string().min(8, { message: 'debe tener al menos 8 caracteres' }),
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
