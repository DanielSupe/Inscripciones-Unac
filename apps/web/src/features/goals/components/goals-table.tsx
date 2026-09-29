import { useState, type FormEvent } from 'react';
import { setFacultyGoalSchema, type FacultyGoalRow } from '@repo/contracts';
import { ApiRequestError } from '../../../lib/http';
import { useClearFacultyGoal, useFacultyGoals, useSetFacultyGoal } from '../api/goals-queries';

export function GoalsTable() {
  const goals = useFacultyGoals();

  return (
    <>
      <h1>Metas de matriculados</h1>
      <p className="subtitulo">
        Cuántos matriculados espera cada facultad, contra cuántos lleva en total acumulado —no solo
        en el periodo en curso.
      </p>

      {goals.isPending && <p role="status">Cargando…</p>}

      {goals.data && (
        <div className="tabla-envoltorio">
          <table className="tabla">
            <thead>
              <tr>
                <th>Facultad</th>
                <th>Meta</th>
                <th>Matriculados</th>
                <th>Avance</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {goals.data.map((row) => (
                <GoalRow key={row.facultyId} row={row} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function GoalRow({ row }: { row: FacultyGoalRow }) {
  const setGoal = useSetFacultyGoal();
  const clearGoal = useClearFacultyGoal();
  const [error, setError] = useState<string | null>(null);
  const inputId = `meta-${row.facultyId}`;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = Object.fromEntries(new FormData(event.currentTarget));
    const parsed = setFacultyGoalSchema.safeParse({ target: Number(form['target']) });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revisa la meta.');
      return;
    }

    try {
      await setGoal.mutateAsync({ facultyId: row.facultyId, ...parsed.data });
    } catch (cause) {
      setError(cause instanceof ApiRequestError ? cause.message : 'No se pudo guardar la meta.');
    }
  }

  async function handleClear() {
    setError(null);
    try {
      await clearGoal.mutateAsync(row.facultyId);
    } catch (cause) {
      setError(cause instanceof ApiRequestError ? cause.message : 'No se pudo quitar la meta.');
    }
  }

  return (
    <tr>
      <td>{row.facultyName}</td>
      <td>
        <form
          className="fila-formulario"
          onSubmit={(e) => void handleSubmit(e)}
          noValidate
        >
          <label htmlFor={inputId} className="visualmente-oculto">
            Meta de matriculados de {row.facultyName}
          </label>
          <input
            id={inputId}
            name="target"
            type="number"
            min={1}
            step={1}
            defaultValue={row.target ?? ''}
            placeholder="Sin meta"
          />
          <button type="submit" disabled={setGoal.isPending}>
            Guardar
          </button>
          {row.target !== null && (
            <button type="button" onClick={() => void handleClear()} disabled={clearGoal.isPending}>
              Quitar
            </button>
          )}
        </form>
        {error && (
          <p className="aviso-caja aviso-caja--error" role="alert">
            {error}
          </p>
        )}
      </td>
      <td>{row.enrolledCount}</td>
      <td>
        {row.target === null ? (
          <span>Sin meta definida</span>
        ) : (
          <>
            <progress
              value={Math.min(row.progressPercent ?? 0, 100)}
              max={100}
              aria-label={`Avance de ${row.facultyName}: ${row.progressPercent ?? 0}%`}
            />
            <span>{row.progressPercent}%</span>
          </>
        )}
      </td>
      <td></td>
    </tr>
  );
}
