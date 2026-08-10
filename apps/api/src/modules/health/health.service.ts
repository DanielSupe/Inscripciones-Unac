import type { HealthStatus } from '@repo/contracts';
import { env } from '@repo/config/server';
import { pingDatabase } from './health.repository';

/**
 * Corre una promesa con un tope de tiempo.
 *
 * Sin esto, una base de datos que ni acepta ni rechaza conexiones deja la
 * consulta de salud colgada indefinidamente, y un supervisor externo no
 * distingue "tarda" de "está caída".
 */
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;

  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`La comprobación superó los ${ms} ms.`));
    }, ms);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Decide si el sistema está operativo.
 *
 * No conoce Express ni códigos HTTP: devuelve el estado y deja que el
 * controller elija cómo se traduce eso a una respuesta.
 */
export async function getHealthStatus(): Promise<HealthStatus> {
  try {
    await withTimeout(pingDatabase(), env.HEALTH_DB_TIMEOUT_MS);
    return { status: 'ok', database: 'ok' };
  } catch {
    // El motivo exacto interesa en los registros, no en la respuesta: el
    // endpoint es público y no puede filtrar host, usuario ni traza.
    return { status: 'degraded', database: 'unreachable' };
  }
}
