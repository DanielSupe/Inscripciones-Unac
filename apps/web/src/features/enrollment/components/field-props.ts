/**
 * Props de accesibilidad que recibe un control cuando su campo tiene error.
 *
 * Vive aparte del componente porque mezclar componentes y utilidades en el
 * mismo archivo rompe la recarga en caliente de React.
 */
export function invalidProps(id: string, error: string | undefined) {
  return error ? { 'aria-invalid': true as const, 'aria-describedby': `${id}-error` } : {};
}
