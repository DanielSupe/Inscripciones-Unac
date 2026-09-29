import { Link } from '@tanstack/react-router';
import { ENROLLMENT_STATUSES, type DashboardGoal } from '@repo/contracts';
import { useAdminDashboard } from '../api/admin-queries';
import { ESTADO_LABELS } from './estado-labels';

export function AdminDashboard() {
  const dashboard = useAdminDashboard();

  if (dashboard.isPending) return <p role="status">Cargando indicadores…</p>;

  if (dashboard.isError) {
    // Sin datos no se pintan ceros: un cero falso se leería como «no hay nada».
    return (
      <p className="aviso-caja aviso-caja--error" role="alert">
        No se pudieron cargar los indicadores. Recarga la página para intentarlo de nuevo.
      </p>
    );
  }

  const { goal, funnel, payments } = dashboard.data;

  return (
    <div className="tablero">
      <GoalBlock goal={goal} />

      <section className="tablero__bloque" aria-labelledby="tablero-embudo">
        <h2 id="tablero-embudo">Aspirantes por etapa</h2>
        <dl className="ficha">
          {ENROLLMENT_STATUSES.map((status) => (
            <div key={status} className="ficha__fila">
              <dt>{ESTADO_LABELS[status]}</dt>
              <dd>{funnel[status]}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="tablero__bloque" aria-labelledby="tablero-pagos">
        <h2 id="tablero-pagos">Pagos</h2>
        <dl className="ficha">
          <div className="ficha__fila">
            <dt>Pendientes de verificar</dt>
            <dd>{payments.PENDING}</dd>
          </div>
          <div className="ficha__fila">
            <dt>Verificados</dt>
            <dd>{payments.VERIFIED}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

function GoalBlock({ goal }: { goal: DashboardGoal }) {
  return (
    <section className="tablero__bloque" aria-labelledby="tablero-meta">
      <h2 id="tablero-meta">Meta de matriculados</h2>
      <p className="subtitulo">Cifras acumuladas de todos los periodos.</p>

      <dl className="ficha">
        <div className="ficha__fila">
          <dt>Meta global</dt>
          <dd>{goal.globalTarget ?? 'Sin meta definida'}</dd>
        </div>
        {goal.globalTarget !== null && (
          <div className="ficha__fila">
            <dt>Matriculados que cuentan para la meta</dt>
            <dd>{goal.enrolledTowardGoal}</dd>
          </div>
        )}
        <div className="ficha__fila">
          <dt>Matriculados en total</dt>
          <dd>{goal.totalEnrolled}</dd>
        </div>
        {goal.progressPercent !== null && (
          <div className="ficha__fila">
            <dt>Avance</dt>
            <dd>
              <progress
                value={Math.min(goal.progressPercent, 100)}
                max={100}
                aria-label={`Avance de la meta global: ${String(goal.progressPercent)}%`}
              />{' '}
              {goal.progressPercent}%
            </dd>
          </div>
        )}
      </dl>

      {goal.facultiesWithoutGoal > 0 && (
        <p className="campo__ayuda">
          {goal.facultiesWithoutGoal === 1
            ? '1 facultad no tiene meta y no cuenta para el avance.'
            : `${String(goal.facultiesWithoutGoal)} facultades no tienen meta y no cuentan para el avance.`}
        </p>
      )}

      <p>
        <Link to="/admin/metas">Ver el detalle por facultad</Link>
      </p>
    </section>
  );
}
