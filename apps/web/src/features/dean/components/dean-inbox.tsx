import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import type { EnrollmentStatus } from '@repo/contracts';
import { ESTADO_LABELS } from '../../admin/components/estado-labels';
import { Paginacion } from '../../admin/components/paginacion';
import { fechaColombia } from '../../../lib/fechas';
import { useDeanInbox } from '../api/dean-queries';

/** Los estados que puede tener algo que ya llegó a la facultad. */
const ESTADOS_DE_FACULTAD = [
  'PENDING_INTERVIEW',
  'INTERVIEW_SCHEDULED',
  'INTERVIEW_HELD',
  'APPROVED',
  'REJECTED',
] as const satisfies readonly EnrollmentStatus[];

export function DeanInbox() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<EnrollmentStatus | ''>('');

  const inbox = useDeanInbox({
    page,
    ...(search ? { search } : {}),
    ...(status ? { status } : {}),
  });

  return (
    <>
      <h1>Aspirantes de mi facultad</h1>
      <p className="subtitulo">
        Aquí llegan las inscripciones cuyos documentos y pago ya comprobó admisiones. Tú agendas la
        entrevista y decides.
      </p>

      <div className="barra-filtros">
        <label htmlFor="buscar-fac" className="visualmente-oculto">
          Buscar
        </label>
        <input
          id="buscar-fac"
          type="search"
          placeholder="Nombre, documento o correo…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />

        <label htmlFor="estado-fac" className="visualmente-oculto">
          Filtrar por estado
        </label>
        <select
          id="estado-fac"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as EnrollmentStatus | '');
            setPage(1);
          }}
        >
          <option value="">Todas las de mi facultad</option>
          {ESTADOS_DE_FACULTAD.map((s) => (
            <option key={s} value={s}>
              {ESTADO_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {inbox.isPending && <p role="status">Cargando…</p>}

      {inbox.data && (
        <>
          <div className="tabla-envoltorio">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Aspirante</th>
                  <th>Programa</th>
                  <th>Estado</th>
                  <th>Entrevista</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {inbox.data.items.map((i) => (
                  <tr key={i.id}>
                    <td>
                      {i.applicantName}
                      <span className="tabla__secundario">{i.applicantDocument}</span>
                      {i.applicantDeleted && <span className="etiqueta-rol">cuenta eliminada</span>}
                    </td>
                    <td>{i.programName ?? '—'}</td>
                    <td>{ESTADO_LABELS[i.status]}</td>
                    <td>{i.interviewAt ? fechaColombia(i.interviewAt) : '—'}</td>
                    <td>
                      <Link to="/facultad/$id" params={{ id: i.id }}>
                        Abrir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {inbox.data.items.length === 0 && (
            <p>Todavía no hay inscripciones de tu facultad esperando respuesta.</p>
          )}

          <Paginacion
            page={inbox.data.page}
            total={inbox.data.total}
            pageSize={inbox.data.pageSize}
            onChange={setPage}
          />
        </>
      )}
    </>
  );
}
