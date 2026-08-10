import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '@repo/config/server';

/**
 * Cliente de Prisma de la aplicación.
 *
 * Este archivo y los `*.repository.ts` son los únicos autorizados a importar
 * `@prisma/client`; el resto del backend llega a los datos pasando por el
 * repository de su módulo. La regla la hace cumplir ESLint, no la buena fe.
 *
 * Prisma 7 exige un adaptador de driver: la cadena de conexión ya no vive en el
 * esquema, sino en la configuración validada al arrancar.
 */
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

export const prisma = new PrismaClient({ adapter });
