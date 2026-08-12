import { useHealthStatus } from '../api/health-queries';

/**
 * Estado del sistema, en versión de pie de página.
 *
 * No es una variante de `HealthPanel` sino otro componente sobre la misma
 * consulta: aquel invita a diagnosticar y este solo informa. Ramificar uno solo
 * habría dado un componente con dos vidas.
 *
 * A diferencia del panel, **omite el detalle del error**. En una pantalla
 * pública no ayuda a nadie y es justo el texto que acaba contando de más.
 */
export function HealthBadge() {
  const { data, isPending, isError } = useHealthStatus();

  if (isPending) {
    return <p className="pulso pulso--espera">Comprobando el sistema…</p>;
  }

  if (isError) {
    return (
      <p className="pulso pulso--mal" role="status">
        <span className="pulso__punto" aria-hidden="true" />
        Sistema no disponible
      </p>
    );
  }

  const operativo = data.status === 'ok';

  return (
    <p className={`pulso ${operativo ? 'pulso--bien' : 'pulso--regular'}`} role="status">
      <span className="pulso__punto" aria-hidden="true" />
      {operativo ? 'Sistema operativo' : 'Sistema degradado'}
    </p>
  );
}
