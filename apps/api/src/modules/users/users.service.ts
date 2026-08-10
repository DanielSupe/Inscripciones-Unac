import type { DocumentType } from '@repo/contracts';
import { ConflictError, UniqueViolationError } from '../../shared/errors';
import * as usersRepository from './users.repository';
import type { User } from './users.repository';

/**
 * Mensaje único para cualquier choque de identidad al registrarse.
 *
 * Documento duplicado y correo duplicado responden exactamente esto. Distinguir
 * los dos casos convertiría el registro en un buscador de quién tiene cuenta en
 * la universidad.
 */
const IDENTIDAD_EN_USO =
  'No fue posible crear la cuenta con los datos indicados. Si ya tienes una cuenta, inicia sesión.';

export interface NewApplicant {
  documentType: DocumentType;
  documentNumber: string;
  email: string;
  passwordHash: string;
  policyVersion: string;
}

/**
 * Da de alta un aspirante.
 *
 * El rol se fija aquí y no se recibe: este camino nunca puede crear un ADMIN,
 * llegue lo que llegue en la petición.
 */
export async function createApplicant(data: NewApplicant): Promise<User> {
  try {
    return await usersRepository.create({
      documentType: data.documentType,
      documentNumber: data.documentNumber,
      email: data.email,
      passwordHash: data.passwordHash,
      role: 'APPLICANT',
      acceptedPolicyVersion: data.policyVersion,
      acceptedPolicyAt: new Date(),
    });
  } catch (error) {
    if (error instanceof UniqueViolationError) {
      // El detalle de qué campo chocó se queda en el servidor, donde sirve para
      // diagnosticar; hacia fuera sale el mensaje neutro.
      console.warn(`[registro] identidad en uso: ${error.fields.join(', ')}`);
      throw new ConflictError(IDENTIDAD_EN_USO);
    }
    throw error;
  }
}

/** Devuelve la cuenta activa con ese correo, o null si no existe o fue eliminada. */
export async function findActiveByEmail(email: string): Promise<User | null> {
  return usersRepository.findActiveByEmail(email);
}

/** Devuelve la cuenta activa con ese identificador, o null. */
export async function findActiveById(id: string): Promise<User | null> {
  return usersRepository.findActiveById(id);
}
