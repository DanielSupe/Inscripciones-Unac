import { useHealthStatus } from '../api/health-queries';

/**
 * Muestra el estado del sistema.
 *
 * Distingue los tres casos a propósito: cargando, operativo y degradado o
 * inalcanzable. Una pantalla en blanco cuando el API no responde es la forma
 * más rápida de perder media hora buscando un fallo que no existe.
 */
export function HealthPanel() {
  const { data, isPending, isError, error, refetch, isFetching } = useHealthStatus();

  if (isPending) {
    return (
      <p className="estado estado--cargando" role="status">
        Comprobando el estado del sistema…
      </p>
    );
  }

  if (isError) {
    return (
      <div className="estado estado--error" role="alert">
        <p>No se pudo consultar el estado del sistema.</p>
        <p className="estado__detalle">{error.message}</p>
        <button type="button" onClick={() => void refetch()} disabled={isFetching}>
          {isFetching ? 'Reintentando…' : 'Reintentar'}
        </button>
      </div>
    );
  }

  const operativo = data.status === 'ok';

  return (
    <div className={`estado ${operativo ? 'estado--ok' : 'estado--degradado'}`} role="status">
      <p>
        <strong>Sistema:</strong> {operativo ? 'operativo' : 'degradado'}
      </p>
      <p>
        <strong>Base de datos:</strong> {data.database === 'ok' ? 'conectada' : 'inalcanzable'}
      </p>
      <button type="button" onClick={() => void refetch()} disabled={isFetching}>
        {isFetching ? 'Actualizando…' : 'Actualizar'}
      </button>
    </div>
  );
}
