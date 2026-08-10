import type { SessionUser } from '@repo/contracts';

// Deja la identidad resuelta disponible para el resto de la cadena. Es de solo
// lectura y la escribe únicamente requireAuth.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      session?: SessionUser;
    }
  }
}

export type { SessionUser };
