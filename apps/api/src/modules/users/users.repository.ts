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

/** Incluidas las eliminadas: la gestión necesita verlas para poder decidir. */
export async function findById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

export interface ListUsersOptions {
  page: number;
  pageSize: number;
  search?: string | undefined;
  role?: Role | undefined;
  includeDeleted: boolean;
}

/**
 * Listado paginado para la consola.
 *
 * La paginación va en la base de datos, no en memoria: traer todo y filtrar
 * después funciona con ocho usuarios y deja de funcionar sin avisar.
 *
 * La búsqueda es parcial e insensible a mayúsculas porque quien escribe «pere»
 * espera encontrar a Pérez.
 */
export async function list(
  options: ListUsersOptions,
): Promise<{ items: User[]; total: number }> {
  const search = options.search?.trim();

  const where: Prisma.UserWhereInput = {
    ...(options.includeDeleted ? {} : activo),
    ...(options.role ? { role: options.role } : {}),
    ...(search
      ? {
          OR: [
            { documentNumber: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (options.page - 1) * options.pageSize,
      take: options.pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return { items, total };
}

export async function update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
  try {
    return await prisma.user.update({ where: { id }, data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = error.meta?.['target'];
      throw new UniqueViolationError(Array.isArray(target) ? target.map(String) : ['desconocido']);
    }
    throw error;
  }
}

/** Borrado lógico. Nunca físico: de una cuenta cuelgan inscripciones y recibos. */
export async function softDelete(id: string): Promise<User> {
  return prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
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
