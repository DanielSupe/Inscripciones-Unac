import bcrypt from 'bcrypt';
import { env } from '@repo/config/server';
import {
  PAGE_SIZE,
  type CreateUserRequest,
  type ManagedUser,
  type Paged,
  type Role,
  type SessionUser,
  type UpdateUserRequest,
  type UserQuery,
} from '@repo/contracts';
import { ConflictError, ForbiddenError, NotFoundError, UniqueViolationError } from '../../shared/errors';
import * as usersRepository from './users.repository';
import type { User } from './users.repository';

function toManagedUser(user: User): ManagedUser {
  return {
    id: user.id,
    documentType: user.documentType,
    documentNumber: user.documentNumber,
    email: user.email,
    role: user.role,
    isSystem: user.isSystem,
    createdAt: user.createdAt.toISOString(),
    deletedAt: user.deletedAt?.toISOString() ?? null,
  };
}

async function requireUser(id: string): Promise<User> {
  const user = await usersRepository.findById(id);
  if (!user) throw new NotFoundError('No encontramos esa cuenta.');
  return user;
}

/**
 * Protecciones de la cuenta de administrador original.
 *
 * `isSystem` está en el modelo desde el primer change esperando este momento.
 * Viven aquí y no en el controller porque son reglas de negocio: cualquier
 * consola futura debe heredarlas sin volver a escribirlas.
 *
 * Restablecer su contraseña **sí** se permite: protegerla de un olvido la
 * dejaría inservible en vez de protegida.
 */
function refuseIfSystemAccount(user: User, accion: string): void {
  if (user.isSystem) {
    throw new ForbiddenError(
      `No se puede ${accion} la cuenta de administrador original: es una cuenta de sistema.`,
    );
  }
}

/** Nadie se hace daño a sí mismo. Siempre contra la sesión, nunca contra la petición. */
function refuseIfSelf(user: User, session: SessionUser, accion: string): void {
  if (user.id === session.id) {
    throw new ForbiddenError(`No puedes ${accion} tu propia cuenta.`);
  }
}

export async function list(query: UserQuery): Promise<Paged<ManagedUser>> {
  const { items, total } = await usersRepository.list({
    page: query.page,
    pageSize: PAGE_SIZE,
    search: query.search,
    role: query.role,
    includeDeleted: query.includeDeleted,
  });

  return { items: items.map(toManagedUser), total, page: query.page, pageSize: PAGE_SIZE };
}

export async function getById(id: string): Promise<ManagedUser> {
  return toManagedUser(await requireUser(id));
}

/**
 * Alta desde la consola.
 *
 * El esquema ya impide pedir el rol STUDENT, así que aquí solo queda cifrar con
 * el mismo coste que el registro público: una contraseña puesta por el
 * administrador no puede ser más débil que una puesta por su dueño.
 */
export async function create(input: CreateUserRequest): Promise<ManagedUser> {
  const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);

  try {
    const user = await usersRepository.create({
      documentType: input.documentType,
      documentNumber: input.documentNumber,
      email: input.email,
      passwordHash,
      role: input.role,
      acceptedPolicyVersion: null,
      acceptedPolicyAt: null,
    });
    return toManagedUser(user);
  } catch (error) {
    if (error instanceof UniqueViolationError) {
      // A diferencia del registro público, aquí sí se dice cuál chocó: quien
      // pregunta ya tiene acceso al listado completo, así que ocultarlo no
      // protegería nada y solo dificultaría corregir el dato.
      const campo = error.fields.some((f) => f.includes('email')) ? 'correo' : 'documento';
      throw new ConflictError(`Ya existe una cuenta con ese ${campo}.`);
    }
    throw error;
  }
}

export async function update(
  id: string,
  session: SessionUser,
  input: UpdateUserRequest,
): Promise<ManagedUser> {
  const user = await requireUser(id);

  if (input.role !== undefined && input.role !== user.role) {
    refuseIfSystemAccount(user, 'cambiar el rol de');
    refuseIfSelf(user, session, 'cambiar el rol de');
  }

  try {
    return toManagedUser(await usersRepository.update(id, input));
  } catch (error) {
    if (error instanceof UniqueViolationError) {
      const campo = error.fields.some((f) => f.includes('email')) ? 'correo' : 'documento';
      throw new ConflictError(`Ya existe otra cuenta con ese ${campo}.`);
    }
    throw error;
  }
}

export async function remove(id: string, session: SessionUser): Promise<void> {
  const user = await requireUser(id);
  refuseIfSystemAccount(user, 'eliminar');
  refuseIfSelf(user, session, 'eliminar');

  await usersRepository.softDelete(id);
}

/**
 * Restablece la contraseña de una cuenta.
 *
 * Es lo que desbloquea a quien la olvidó, dado que no hay envío de correo. El
 * administrador la conoce y tiene que comunicarla por fuera; queda anotado como
 * deuda hasta que exista correo.
 */
export async function resetPassword(id: string, password: string): Promise<void> {
  const user = await requireUser(id);
  const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

  await usersRepository.update(user.id, { passwordHash });
}

/**
 * Cambia el rol de una cuenta. La invoca la aprobación de una inscripción
 * dentro de su transacción, que es el único camino hacia STUDENT.
 */
export async function changeRole(id: string, role: Role): Promise<void> {
  await usersRepository.update(id, { role });
}
