import { useState } from 'react';

/**
 * Campo de contraseña con revelado.
 *
 * El botón lleva `aria-pressed` y su nombre cambia con el estado, de modo que
 * saber si la contraseña está a la vista no dependa de poder verla. Es la
 * diferencia entre un control accesible y un icono decorativo.
 */
export function PasswordField({
  id,
  name,
  label,
  autoComplete,
  ayuda,
  required = false,
}: {
  id: string;
  name: string;
  label: string;
  autoComplete: 'current-password' | 'new-password';
  ayuda?: string;
  required?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <label htmlFor={id}>
        {label}{' '}
        {required && (
          <span className="campo__obligatorio" aria-hidden="true">
            *
          </span>
        )}
      </label>

      <div className="campo-clave">
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          required={required}
        />
        <button
          type="button"
          className="campo-clave__ojo"
          aria-pressed={visible}
          aria-controls={id}
          onClick={() => { setVisible((actual) => !actual); }}
        >
          <span className="visualmente-oculto">
            {visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          </span>
          <OjoIcono tachado={visible} />
        </button>
      </div>

      {ayuda && <span className="campo__ayuda">{ayuda}</span>}
    </>
  );
}

function OjoIcono({ tachado }: { tachado: boolean }) {
  return (
    <svg
      className="campo-clave__icono"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.8" />
      {tachado && <path d="M4 20 20 4" />}
    </svg>
  );
}
