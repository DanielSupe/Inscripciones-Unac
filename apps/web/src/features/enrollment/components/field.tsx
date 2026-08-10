import type { ReactNode } from 'react';

/**
 * Campo con su etiqueta y su error, enlazados por id.
 *
 * Va aquí y no dentro de cada paso para que los cuatro formularios se comporten
 * igual: mismo enlace de `aria-describedby`, misma marca de inválido, mismo
 * sitio para el mensaje.
 */
export function Field({
  id,
  label,
  error,
  help,
  children,
}: {
  id: string;
  label: string;
  error?: string | undefined;
  help?: string;
  children: ReactNode;
}) {
  return (
    <>
      <label htmlFor={id}>{label}</label>
      {children}
      {help && <span className="campo__ayuda">{help}</span>}
      {error && (
        <span className="campo__error" id={`${id}-error`}>
          {error}
        </span>
      )}
    </>
  );
}
