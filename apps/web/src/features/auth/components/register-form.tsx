import { useState, type FormEvent } from 'react';
import { Link, useRouter } from '@tanstack/react-router';
import {
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
  PASSWORD_MIN_LENGTH,
  registerRequestSchema,
} from '@repo/contracts';
import { ApiRequestError } from '../../../lib/http';
import { setNotice } from '../../../lib/notice';
import { useRegister } from '../api/auth-queries';

/**
 * Mensaje de error de un campo, enlazado por id con su control.
 *
 * Va fuera del componente a propósito: declarada dentro, React la trataría como
 * un componente nuevo en cada render y perdería su estado.
 */
function FieldError({ id, message }: { id: string; message: string | undefined }) {
  if (!message) return null;
  return (
    <span className="campo__error" id={`${id}-error`}>
      {message}
    </span>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const register = useRegister();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const form = new FormData(event.currentTarget);
    // Se valida con el mismo esquema que usa el backend, así que el formulario
    // no puede exigir algo distinto de lo que el API acepta.
    const parsed = registerRequestSchema.safeParse({
      documentType: form.get('documentType'),
      documentNumber: form.get('documentNumber'),
      email: form.get('email'),
      emailConfirmation: form.get('emailConfirmation'),
      password: form.get('password'),
      acceptedPolicies: form.get('acceptedPolicies') === 'on',
    });

    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path.map(String).join('.');
        errors[field] ??= issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    try {
      await register.mutateAsync(parsed.data);
      setNotice({ tone: 'exito', message: 'Tu cuenta quedó creada. Ya puedes ingresar.' });
      await router.navigate({ to: '/' });
    } catch (cause) {
      setError(
        cause instanceof ApiRequestError
          ? cause.message
          : 'No se pudo crear la cuenta. Inténtalo de nuevo.',
      );
    }
  }

  /** Enlaza cada campo con su mensaje de error para lectores de pantalla. */
  function fieldProps(name: string) {
    const message = fieldErrors[name];
    return message
      ? { 'aria-invalid': true as const, 'aria-describedby': `${name}-error` }
      : {};
  }

  return (
    <form className="formulario" onSubmit={(e) => void handleSubmit(e)} noValidate>
      <h1>Crear cuenta en SION</h1>
      <p className="formulario__intro">
        Con esta cuenta podrás realizar tu inscripción y consultar tu proceso.
      </p>

      {error && (
        <p className="aviso-caja aviso-caja--error" role="alert">
          {error}
        </p>
      )}

      <label htmlFor="documentType">Tipo de documento</label>
      <select id="documentType" name="documentType" defaultValue="CC" {...fieldProps('documentType')}>
        {DOCUMENT_TYPES.map((type) => (
          <option key={type} value={type}>
            {DOCUMENT_TYPE_LABELS[type]}
          </option>
        ))}
      </select>
      <FieldError id="documentType" message={fieldErrors['documentType']} />

      <label htmlFor="documentNumber">Número de documento</label>
      <input id="documentNumber" name="documentNumber" inputMode="numeric" required {...fieldProps('documentNumber')} />
      <FieldError id="documentNumber" message={fieldErrors['documentNumber']} />

      <label htmlFor="email">Correo electrónico</label>
      <input id="email" name="email" type="email" autoComplete="email" required {...fieldProps('email')} />
      <FieldError id="email" message={fieldErrors['email']} />

      <label htmlFor="emailConfirmation">Confirma tu correo</label>
      <input
        id="emailConfirmation"
        name="emailConfirmation"
        type="email"
        autoComplete="email"
        required
        {...fieldProps('emailConfirmation')}
      />
      <FieldError id="emailConfirmation" message={fieldErrors['emailConfirmation']} />

      <label htmlFor="password">Contraseña</label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        {...fieldProps('password')}
      />
      <span className="campo__ayuda">Mínimo {PASSWORD_MIN_LENGTH} caracteres.</span>
      <FieldError id="password" message={fieldErrors['password']} />

      <div className="casilla">
        <input id="acceptedPolicies" name="acceptedPolicies" type="checkbox" {...fieldProps('acceptedPolicies')} />
        <label htmlFor="acceptedPolicies">
          Acepto las{' '}
          {/* Se abre en otra pestaña para no perder lo ya escrito en el formulario. */}
          <Link to="/politicas" target="_blank" rel="noopener">
            políticas de tratamiento de datos
          </Link>
        </label>
      </div>
      <FieldError id="acceptedPolicies" message={fieldErrors['acceptedPolicies']} />

      <button type="submit" disabled={register.isPending}>
        {register.isPending ? 'Creando cuenta…' : 'Crear cuenta'}
      </button>

      <p className="formulario__pie">
        ¿Ya tienes cuenta? <Link to="/">Ingresa aquí</Link>
      </p>
    </form>
  );
}
