import { useState, type FormEvent } from 'react';
import { PASSWORD_MIN_LENGTH, resetPasswordSchema, type ManagedUser } from '@repo/contracts';
import { Modal } from '../../../components/modal';
import { ApiRequestError } from '../../../lib/http';
import { useResetPassword } from '../api/admin-queries';

/**
 * Restablecimiento de contraseña.
 *
 * Es lo que desbloquea a quien la olvidó, porque no hay envío de correo. Se
 * avisa explícitamente de que hay que comunicarla por fuera: el sistema no lo
 * hace, y darlo por supuesto dejaría a la persona igual de bloqueada.
 */
export function ResetPasswordDialog({
  user,
  onClose,
}: {
  user: ManagedUser;
  onClose: () => void;
}) {
  const reset = useResetPassword();
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const parsed = resetPasswordSchema.safeParse({ password: form.get('password') });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Contraseña inválida.');
      return;
    }

    try {
      await reset.mutateAsync({ id: user.id, password: parsed.data.password });
      setListo(true);
    } catch (cause) {
      setError(cause instanceof ApiRequestError ? cause.message : 'No se pudo restablecer.');
    }
  }

  return (
    <Modal label="Restablecer contraseña" onClose={onClose}>
      <form className="formulario" onSubmit={(e) => void handleSubmit(e)} noValidate>
        <p className="formulario__intro">Cuenta: {user.email}</p>

        {listo ? (
          <>
            <p className="aviso-caja aviso-caja--exito" role="status">
              Contraseña restablecida. <strong>Comunícasela a la persona</strong>: el sistema no
              envía correos, así que no se enterará por sí sola.
            </p>
          </>
        ) : (
          <>
            {error && (
              <p className="aviso-caja aviso-caja--error" role="alert">
                {error}
              </p>
            )}

            <label htmlFor="password">Contraseña nueva</label>
            <input id="password" name="password" type="password" autoComplete="new-password" />
            <span className="campo__ayuda">Mínimo {PASSWORD_MIN_LENGTH} caracteres.</span>

            <div className="modal__pie">
              <button type="submit" className="boton boton--primario" disabled={reset.isPending}>
                {reset.isPending ? 'Restableciendo…' : 'Restablecer'}
              </button>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}
