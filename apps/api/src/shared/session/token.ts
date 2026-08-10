import jwt from 'jsonwebtoken';
import { env } from '@repo/config/server';

/** Lo único que viaja dentro del token: quién eres. */
interface SessionPayload {
  sub: string;
}

export function issueSessionToken(userId: string): string {
  return jwt.sign({ sub: userId } satisfies SessionPayload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

/**
 * Devuelve el identificador de usuario del token, o null si el token no es
 * válido, está caducado o lo firmó otro.
 *
 * El token dice quién eres; **no** dice qué rol tienes. El rol se resuelve
 * siempre contra la base de datos, porque un rol dentro del token quedaría
 * congelado en el momento de la firma y sobreviviría a un cambio de permisos o
 * a la eliminación de la cuenta.
 */
export function readSessionToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    if (typeof payload === 'string' || typeof payload.sub !== 'string') return null;
    return payload.sub;
  } catch {
    return null;
  }
}
