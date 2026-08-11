import { useState, type FormEvent } from 'react';
import {
  ASSIGNABLE_ROLES,
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
  PASSWORD_MIN_LENGTH,
  createUserSchema,
  updateUserSchema,
  type ManagedUser,
} from '@repo/contracts';
import { ROLE_LABELS } from '../../../components/navigation';
import { ApiRequestError } from '../../../lib/http';
import { useCreateUser, useUpdateUser } from '../api/admin-queries';

/**
 * Alta y edición de cuenta.
 *
 * El rol de estudiante no se ofrece: no es una omisión de la interfaz sino la
 * regla, que el esquema compartido también hace cumplir en el servidor.
 */
export function UserForm({ user, onClose }: { user?: ManagedUser; onClose: () => void }) {
  const editando = user !== undefined;
  const create = useCreateUser();
  const update = useUpdateUser(user?.id ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setErrors({});

    const form = Object.fromEntries(new FormData(event.currentTarget));
    const parsed = editando
      ? updateUserSchema.safeParse(form)
      : createUserSchema.safeParse(form);

    if (!parsed.success) {
      const detalle: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        detalle[issue.path.map(String).join('.')] ??= issue.message;
      }
      setErrors(detalle);
      return;
    }

    try {
      if (editando) {
        await update.mutateAsync(parsed.data as Parameters<typeof update.mutateAsync>[0]);
      } else {
        await create.mutateAsync(parsed.data as Parameters<typeof create.mutateAsync>[0]);
      }
      onClose();
    } catch (cause) {
      setError(cause instanceof ApiRequestError ? cause.message : 'No se pudo guardar.');
    }
  }

  const guardando = create.isPending || update.isPending;

  return (
    <div className="panel">
      <form className="formulario" onSubmit={(e) => void handleSubmit(e)} noValidate>
        <h2>{editando ? 'Editar cuenta' : 'Crear cuenta'}</h2>

        {error && (
          <p className="aviso-caja aviso-caja--error" role="alert">
            {error}
          </p>
        )}

        <label htmlFor="documentType">Tipo de documento</label>
        <select id="documentType" name="documentType" defaultValue={user?.documentType ?? 'CC'}>
          {DOCUMENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {DOCUMENT_TYPE_LABELS[t]}
            </option>
          ))}
        </select>

        <label htmlFor="documentNumber">Número de documento</label>
        <input id="documentNumber" name="documentNumber" defaultValue={user?.documentNumber ?? ''} />
        {errors['documentNumber'] && <span className="campo__error">{errors['documentNumber']}</span>}

        <label htmlFor="email">Correo electrónico</label>
        <input id="email" name="email" type="email" defaultValue={user?.email ?? ''} />
        {errors['email'] && <span className="campo__error">{errors['email']}</span>}

        <label htmlFor="role">Rol</label>
        <select id="role" name="role" defaultValue={user?.role ?? 'APPLICANT'}>
          {ASSIGNABLE_ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
        <span className="campo__ayuda">
          A estudiante solo se llega aprobando una inscripción.
        </span>
        {errors['role'] && <span className="campo__error">{errors['role']}</span>}

        {!editando && (
          <>
            <label htmlFor="password">Contraseña inicial</label>
            <input id="password" name="password" type="password" autoComplete="new-password" />
            <span className="campo__ayuda">
              Mínimo {PASSWORD_MIN_LENGTH} caracteres. Tendrás que comunicársela a la persona.
            </span>
            {errors['password'] && <span className="campo__error">{errors['password']}</span>}
          </>
        )}

        <div className="panel__acciones">
          <button type="submit" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
          <button type="button" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
