import bcrypt from 'bcrypt';
import type { LoginRequest, RegisterRequest, SessionUser } from '@repo/contracts';
import { env } from '@repo/config/server';
import { UnauthorizedError } from '../../shared/errors';
import * as usersService from '../users/users.service';
import { toSessionUser } from '../users/users.mapper';

/**
 * Mensaje único para cualquier fallo de ingreso.
 *
 * Correo inexistente, contraseña incorrecta y cuenta eliminada responden esto
 * mismo. Distinguirlos permitiría averiguar quién tiene cuenta probando correos.
 */
const CREDENCIALES_INVALIDAS = 'El correo o la contraseña no son correctos.';

/**
 * Hash de descarte contra el que comparar cuando el correo no existe.
 *
 * Sin esto la respuesta llega antes cuando la cuenta no existe, y el mensaje
 * neutro deja de servir para nada: el tiempo de respuesta cuenta lo que el
 * mensaje calla. Se calcula una vez al arrancar.
 */
const HASH_DE_DESCARTE = bcrypt.hashSync('cuenta-inexistente', env.BCRYPT_ROUNDS);

/**
 * Crea una cuenta de aspirante.
 *
 * Recibe la petición ya validada. `emailConfirmation` se comprobó en el
 * esquema y no se almacena; `acceptedPolicies` solo puede ser `true` por el
 * mismo esquema, y lo que se guarda es qué versión se aceptó y cuándo.
 */
export async function register(input: RegisterRequest): Promise<SessionUser> {
  const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);

  const user = await usersService.createApplicant({
    documentType: input.documentType,
    documentNumber: input.documentNumber,
    email: input.email,
    passwordHash,
    policyVersion: env.POLICY_VERSION,
  });

  return toSessionUser(user);
}

/**
 * Comprueba las credenciales y devuelve la identidad.
 *
 * Compara siempre un hash, exista la cuenta o no, para que el tiempo de
 * respuesta no delate si el correo está registrado.
 */
export async function login(input: LoginRequest): Promise<SessionUser> {
  const user = await usersService.findActiveByEmail(input.email);

  const passwordMatches = await bcrypt.compare(
    input.password,
    user?.passwordHash ?? HASH_DE_DESCARTE,
  );

  if (!user || !passwordMatches) {
    throw new UnauthorizedError(CREDENCIALES_INVALIDAS);
  }

  return toSessionUser(user);
}

/**
 * Resuelve la identidad de una sesión contra la base de datos.
 *
 * Se consulta en cada petición a propósito: el token solo dice quién eres, y la
 * cuenta puede haberse eliminado o cambiado de rol después de firmarlo.
 */
export async function resolveSession(userId: string): Promise<SessionUser | null> {
  const user = await usersService.findActiveById(userId);
  return user ? toSessionUser(user) : null;
}
