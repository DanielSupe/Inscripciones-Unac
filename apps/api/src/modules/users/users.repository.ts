import { Prisma, type User } from '@prisma/client';
import type { DocumentType, Role } from '@repo/contracts';
import { prisma } from '../../shared/database/prisma';
import { UniqueViolationError } from '../../shared/errors';

export type { User };

/**
 * Una cuenta "activa" es la que no ha sido eliminada de forma lógica. Todas las
 * búsquedas la exigen por defecto: una cuenta eliminada no debe poder ingresar
 * ni aparecer en ningún listado.
 */
const activo = { deletedAt: null };

export async function findActiveByEmail(email: string): Promise<User | null> {
  return prisma.user.findFirst({ where: { email, ...activo } });
}

export async function findActiveById(id: string): Promise<User | null> {
  return prisma.user.findFirst({ where: { id, ...activo } });
}

export interface CreateUserData {
  documentType: DocumentType;
  documentNumber: string;
  email: string;
  passwordHash: string;
  role: Role;
  acceptedPolicyVersion: string | null;
  acceptedPolicyAt: Date | null;
}

/**
 * Crea la cuenta dejando que sea la base de datos quien decida si el documento
 * o el correo ya existen.
 *
 * No se consulta antes a propósito: entre la consulta y la escritura hay una
 * ventana por la que pasan dos registros simultáneos con el mismo documento. El
 * índice único no tiene esa ventana, y ese caso está en la spec.
 *
 * El índice cubre también las cuentas eliminadas lógicamente, así que reusar el
 * documento de una cuenta borrada choca igual, que es lo que se quiere.
 */
export async function create(data: CreateUserData): Promise<User> {
  try {
    return await prisma.user.create({ data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = error.meta?.['target'];
      throw new UniqueViolationError(Array.isArray(target) ? target.map(String) : ['desconocido']);
    }
    throw error;
  }
}
