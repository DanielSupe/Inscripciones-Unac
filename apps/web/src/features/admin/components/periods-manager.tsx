import { useState, type FormEvent } from 'react';
import { createPeriodSchema, type ManagedPeriod } from '@repo/contracts';
import { Modal } from '../../../components/modal';
import { ApiRequestError } from '../../../lib/http';
import { useCreatePeriod, usePeriods, useUpdatePeriod } from '../api/admin-queries';

const dinero = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

/** Solo la parte de fecha: los campos `date` no admiten la hora. */
function soloFecha(iso: string): string {
  return iso.slice(0, 10);
}

export function PeriodsManager() {
  const periods = usePeriods();
  const [editando, setEditando] = useState<ManagedPeriod | null>(null);
  const [creando, setCreando] = useState(false);

  return (
    <>
      <h1>Periodos académicos</h1>
      <p className="subtitulo">
        Un periodo se desactiva, nunca se borra: de él cuelgan inscripciones y recibos.
      </p>

      <p>
        <button type="button" className="boton boton--primario" onClick={() => { setCreando(true); }}>
          Crear periodo
        </button>
      </p>

      {periods.isPending && <p role="status">Cargando…</p>}

      {periods.data && (
        <div className="tabla-envoltorio">
          <table className="tabla">
            <thead>
              <tr>
                <th>Código</th>
                <th>Apertura</th>
                <th>Cierre</th>
                <th>Tarifa</th>
                <th>Inscripciones</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {periods.data.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.code}
                    {!p.isActive && <span className="etiqueta-rol">inactivo</span>}
                  </td>
                  <td>{soloFecha(p.opensAt)}</td>
                  <td>{soloFecha(p.closesAt)}</td>
                  <td>{dinero.format(p.enrollmentFeeAmount)}</td>
                  <td>{p.enrollmentCount}</td>
                  <td>
                    <button type="button" onClick={() => { setEditando(p); }}>
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creando && <PeriodForm onClose={() => { setCreando(false); }} />}
      {editando && <PeriodForm period={editando} onClose={() => { setEditando(null); }} />}
    </>
  );
}

function PeriodForm({ period, onClose }: { period?: ManagedPeriod; onClose: () => void }) {
  const editando = period !== undefined;
  const create = useCreatePeriod();
  const update = useUpdatePeriod(period?.id ?? '');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = Object.fromEntries(new FormData(event.currentTarget));
    const datos = {
      ...form,
      isActive: form['isActive'] === 'on',
    };

    const parsed = createPeriodSchema.safeParse(
      editando ? { ...datos, code: period.code } : datos,
    );
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revisa los datos del periodo.');
      return;
    }

    try {
      if (editando) {
        const { code: _code, ...sinCodigo } = parsed.data;
        await update.mutateAsync(sinCodigo);
      } else {
        await create.mutateAsync(parsed.data);
      }
      onClose();
    } catch (cause) {
      setError(cause instanceof ApiRequestError ? cause.message : 'No se pudo guardar.');
    }
  }

  return (
    <Modal label={editando ? `Editar periodo ${period.code}` : 'Crear periodo'} onClose={onClose}>
      <form className="formulario" onSubmit={(e) => void handleSubmit(e)} noValidate>

        {error && (
          <p className="aviso-caja aviso-caja--error" role="alert">
            {error}
          </p>
        )}

        {!editando && (
          <>
            <label htmlFor="code">Código</label>
            <input id="code" name="code" placeholder="2027-1" />
            <span className="campo__ayuda">Formato AAAA-1 o AAAA-2. No se puede cambiar después.</span>
          </>
        )}

        <label htmlFor="opensAt">Abre el</label>
        <input
          id="opensAt"
          name="opensAt"
          type="date"
          defaultValue={period ? soloFecha(period.opensAt) : ''}
        />

        <label htmlFor="closesAt">Cierra el</label>
        <input
          id="closesAt"
          name="closesAt"
          type="date"
          defaultValue={period ? soloFecha(period.closesAt) : ''}
        />

        <label htmlFor="enrollmentFeeAmount">Derecho de inscripción</label>
        <input
          id="enrollmentFeeAmount"
          name="enrollmentFeeAmount"
          inputMode="numeric"
          defaultValue={period?.enrollmentFeeAmount ?? ''}
        />
        <span className="campo__ayuda">
          Cambiarlo no altera los recibos ya emitidos.
        </span>

        <div className="casilla">
          <input
            id="isActive"
            name="isActive"
            type="checkbox"
            defaultChecked={period?.isActive ?? true}
          />
          <label htmlFor="isActive">Activo</label>
        </div>

        <div className="modal__pie">
          <button
            type="submit"
            className="boton boton--primario"
            disabled={create.isPending || update.isPending}
          >
            Guardar
          </button>
        </div>
      </form>
    </Modal>
  );
}
