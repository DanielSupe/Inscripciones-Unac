import { useState, type FormEvent } from 'react';
import { Link, useRouter } from '@tanstack/react-router';
import { loginRequestSchema } from '@repo/contracts';
import { ApiRequestError } from '../../../lib/http';
import { consumeNotice } from '../../../lib/notice';
import { homePathFor, useLogin } from '../api/auth-queries';

export function LoginForm() {
  const router = useRouter();
  const login = useLogin();
  // Se consume una sola vez al montar: recargar no debe repetir un aviso que ya
  // no viene a cuento.
  const [notice] = useState(() => consumeNotice());
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const parsed = loginRequestSchema.safeParse({
      email: form.get('email'),
      password: form.get('password'),
    });

    if (!parsed.success) {
      // El mismo mensaje que ante credenciales incorrectas: distinguirlos
      // permitiría sondear qué correos existen.
      setError('El correo o la contraseña no son correctos.');
      return;
    }

    try {
      const user = await login.mutateAsync(parsed.data);
      await router.navigate({ to: homePathFor(user.role) });
    } catch (cause) {
      setError(
        cause instanceof ApiRequestError
          ? cause.message
          : 'No se pudo completar el ingreso. Inténtalo de nuevo.',
      );
    }
  }

  return (
    <form className="formulario" onSubmit={(e) => void handleSubmit(e)} noValidate>
      <h1>Ingresar a SION</h1>

      {notice && (
        <p className={`aviso-caja aviso-caja--${notice.tone}`} role="status">
          {notice.message}
        </p>
      )}

      {error && (
        <p className="aviso-caja aviso-caja--error" role="alert">
          {error}
        </p>
      )}

      <label htmlFor="email">Correo electrónico</label>
      <input id="email" name="email" type="email" autoComplete="email" required />

      <label htmlFor="password">Contraseña</label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />

      <button type="submit" disabled={login.isPending}>
        {login.isPending ? 'Ingresando…' : 'Ingresar'}
      </button>

      <p className="formulario__pie">
        ¿No tienes cuenta? <Link to="/registro">Crea una aquí</Link>
      </p>
    </form>
  );
}
