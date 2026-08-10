import { prisma } from '../../shared/database/prisma';

/**
 * Comprueba que la base de datos responde de verdad.
 *
 * Ejecuta una consulta real en vez de mirar si el cliente cree estar conectado:
 * una conexión puede seguir "abierta" contra una base de datos que ya no acepta
 * trabajo, y eso es justo el caso que esta comprobación existe para detectar.
 */
export async function pingDatabase(): Promise<void> {
  await prisma.$queryRaw`SELECT 1`;
}
