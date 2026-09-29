import { Link } from '@tanstack/react-router';
import {
  ENROLLMENT_STATUSES,
  type AdminDashboard as AdminDashboardData,
  type DashboardGoal,
  type FacultyGoalRow,
} from '@repo/contracts';
import { useFacultyGoals } from '../../goals/api/goals-queries';
import { useAdminDashboard } from '../api/admin-queries';
import { ESTADO_LABELS } from './estado-labels';

const numero = new Intl.NumberFormat('es-CO');

/** Porcentaje de `valor` sobre `escala`, acotado a la pista. */
function ancho(valor: number, escala: number): string {
  return `${String(Math.min(100, (valor / escala) * 100))}%`;
}

export function AdminDashboard() {
  const dashboard = useAdminDashboard();

  return (
    <div className="tablero">
      {dashboard.isPending && <p role="status">Cargando indicadores…</p>}

      {dashboard.isError && (
        // Sin datos no se pintan ceros: un cero falso se leería como «no hay nada».
        <p className="aviso-caja aviso-caja--error tarjeta--ancha" role="alert">
          No se pudieron cargar los indicadores. Recarga la página para intentarlo de nuevo.
        </p>
      )}

      {dashboard.data && <GoalCard goal={dashboard.data.goal} />}
      {dashboard.data && <PaymentsCard payments={dashboard.data.payments} />}
      <FacultyProgressCard />
      {dashboard.data && <FunnelCard funnel={dashboard.data.funnel} />}
    </div>
  );
}

function GoalCard({ goal }: { goal: DashboardGoal }) {
  const { globalTarget, progressPercent } = goal;

  return (
    <section className="tarjeta" aria-labelledby="tablero-meta">
      <h2 id="tablero-meta" className="tarjeta__titulo">
        Meta de matriculados
      </h2>
      <p className="tarjeta__nota">Cifras acumuladas de todos los periodos.</p>

      {globalTarget === null || progressPercent === null ? (
        <p className="cifra">
          <span className="cifra__valor">{numero.format(goal.totalEnrolled)}</span>
          <span className="cifra__contexto">matriculados · sin meta definida</span>
        </p>
      ) : (
        <>
          <p className="cifra">
            <span className="cifra__valor">{progressPercent}%</span>
            <span className="cifra__contexto">
              {numero.format(goal.enrolledTowardGoal)} de {numero.format(globalTarget)}{' '}
              matriculados
            </span>
          </p>
          <div
            className="medidor"
            role="meter"
            aria-label="Avance de la meta global"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.min(progressPercent, 100)}
            aria-valuetext={`${String(progressPercent)}%`}
          >
            <div className="medidor__relleno" style={{ width: ancho(progressPercent, 100) }} />
          </div>
        </>
      )}

      <dl className="indicadores">
        <div className="indicador">
          <dt>Meta global</dt>
          <dd>{globalTarget === null ? '—' : numero.format(globalTarget)}</dd>
        </div>
        <div className="indicador">
          <dt>Matriculados en total</dt>
          <dd>{numero.format(goal.totalEnrolled)}</dd>
        </div>
        <div className="indicador">
          <dt>Facultades sin meta</dt>
          <dd>{goal.facultiesWithoutGoal}</dd>
        </div>
      </dl>

      {goal.facultiesWithoutGoal > 0 && (
        <p className="tarjeta__nota">
          Las facultades sin meta suman al total, pero no cuentan para el avance.
        </p>
      )}
    </section>
  );
}

function FacultyProgressCard() {
  const goals = useFacultyGoals();

  return (
    <section className="tarjeta tarjeta--ancha" aria-labelledby="tablero-facultades">
      <h2 id="tablero-facultades" className="tarjeta__titulo">
        Avance por facultad
      </h2>
      <p className="tarjeta__nota">Matriculados frente a la meta de cada facultad.</p>

      {goals.isPending && <p role="status">Cargando…</p>}

      {goals.isError && (
        <p className="aviso-caja aviso-caja--error" role="alert">
          No se pudo cargar el avance por facultad.
        </p>
      )}

      {goals.data && (
        <>
          <ul className="leyenda" aria-hidden="true">
            <li>
              <span className="leyenda__serie" /> Matriculados
            </li>
            <li>
              <span className="leyenda__meta" /> Meta
            </li>
          </ul>

          {/* Escala común: el mayor de todas las metas y matriculados, para que
              ninguna barra se corte y las facultades se comparen entre sí. */}
          <FacultyBars
            rows={goals.data}
            scale={Math.max(
              1,
              ...goals.data.map((row) => Math.max(row.enrolledCount, row.target ?? 0)),
            )}
          />
        </>
      )}

      <p className="tarjeta__pie">
        <Link to="/admin/metas">Fijar o cambiar las metas</Link>
      </p>
    </section>
  );
}

function FacultyBars({
  rows,
  scale,
}: {
  rows: FacultyGoalRow[];
  scale: number;
}) {
  return (
    <ul className="barras">
      {rows.map((row) => {
        const texto =
          row.target === null
            ? `${numero.format(row.enrolledCount)} · sin meta`
            : `${numero.format(row.enrolledCount)} de ${numero.format(row.target)}`;

        return (
          <li key={row.facultyId} className="barras__fila">
            <span className="barras__etiqueta">{row.facultyName}</span>
            <span className="barras__pista" aria-hidden="true" title={texto}>
              <span
                className="barras__barra"
                style={{
                  width: ancho(row.enrolledCount, scale),
                  minWidth: row.enrolledCount === 0 ? 0 : undefined,
                }}
              />
              {row.target !== null && (
                <span className="barras__meta" style={{ left: ancho(row.target, scale) }} />
              )}
            </span>
            <span
              className={
                row.target === null ? 'barras__cifra barras__cifra--tenue' : 'barras__cifra'
              }
            >
              {texto}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function FunnelCard({ funnel }: { funnel: AdminDashboardData['funnel'] }) {
  const scale = Math.max(1, ...ENROLLMENT_STATUSES.map((status) => funnel[status]));

  return (
    <section className="tarjeta tarjeta--ancha" aria-labelledby="tablero-embudo">
      <h2 id="tablero-embudo" className="tarjeta__titulo">
        Aspirantes por etapa
      </h2>
      <p className="tarjeta__nota">Inscripciones en cada estado, en el orden del proceso.</p>

      <ul className="barras">
        {ENROLLMENT_STATUSES.map((status) => (
          <li key={status} className="barras__fila">
            <span className="barras__etiqueta">{ESTADO_LABELS[status]}</span>
            <span className="barras__pista" aria-hidden="true" title={String(funnel[status])}>
              <span
                className="barras__barra"
                style={{
                  width: ancho(funnel[status], scale),
                  // Un estado vacío no dibuja barra: el mínimo de 2px mentiría.
                  minWidth: funnel[status] === 0 ? 0 : undefined,
                }}
              />
            </span>
            <span className="barras__cifra">{numero.format(funnel[status])}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PaymentsCard({ payments }: { payments: AdminDashboardData['payments'] }) {
  const total = payments.PENDING + payments.VERIFIED;
  const verifiedPercent = total === 0 ? 0 : Math.round((payments.VERIFIED / total) * 100);

  return (
    <section className="tarjeta" aria-labelledby="tablero-pagos">
      <h2 id="tablero-pagos" className="tarjeta__titulo">
        Pagos
      </h2>
      <p className="tarjeta__nota">Recibos emitidos y su verificación.</p>

      {total === 0 ? (
        <p className="cifra__contexto">Todavía no hay recibos emitidos.</p>
      ) : (
        <>
          <p className="cifra">
            <span className="cifra__valor">{verifiedPercent}%</span>
            <span className="cifra__contexto">
              verificados · {numero.format(payments.VERIFIED)} de {numero.format(total)} recibos
            </span>
          </p>
          <div
            className="medidor"
            role="meter"
            aria-label="Recibos verificados"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={verifiedPercent}
            aria-valuetext={`${String(verifiedPercent)}%`}
          >
            <div className="medidor__relleno" style={{ width: ancho(verifiedPercent, 100) }} />
          </div>
          {payments.PENDING === 0 ? (
            <p className="pendientes">Ningún recibo pendiente de verificar.</p>
          ) : (
            <p className="pendientes">
              <span className="pendientes__icono" aria-hidden="true">
                !
              </span>
              {payments.PENDING === 1
                ? '1 recibo pendiente de verificar'
                : `${numero.format(payments.PENDING)} recibos pendientes de verificar`}
            </p>
          )}
        </>
      )}
    </section>
  );
}
