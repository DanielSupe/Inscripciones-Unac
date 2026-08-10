import type { ZodError } from 'zod';

/**
 * Convierte los problemas de validación del entorno en un mensaje único.
 *
 * Se listan todos de una vez a propósito. Con `parse` a secas Zod lanza en el
 * primer fallo, y configurar un servidor nuevo se convierte en arrancar,
 * corregir una variable, arrancar otra vez.
 *
 * Nunca se imprime el valor de la variable, solo su nombre: un mensaje de error
 * termina en los registros del host, y ahí no puede acabar un secreto.
 */
export function formatEnvError(error: ZodError, source: string): string {
  const problems = error.issues.map((issue) => {
    const name = issue.path.length > 0 ? issue.path.join('.') : '(raíz)';
    return `  · ${name}: ${issue.message}`;
  });

  const pending =
    problems.length === 1
      ? 'la variable señalada arriba'
      : `las ${problems.length} variables señaladas arriba`;

  return [
    '',
    `✗ Configuración inválida (${source}).`,
    '',
    ...problems,
    '',
    `Revisa el .env.example correspondiente y corrige ${pending}.`,
    'Los valores no se imprimen para no exponer secretos.',
    '',
  ].join('\n');
}
