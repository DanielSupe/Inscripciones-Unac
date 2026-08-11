import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ENROLLMENT_STATUSES, type EnrollmentStatus } from '@repo/contracts';
import { useInbox } from '../api/admin-queries';
import { ESTADO_LABELS } from './estado-labels';
import { Paginacion } from './paginacion';

export function ReviewInbox() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<EnrollmentStatus | ''>('');

  const inbox = useInbox({
    page,
    ...(search ? { search } : {}),
    ...(status ? { status } : {}),
  });

  return (
    <>
      <h1>Aspirantes</h1>
      <p className="subtitulo">
        Las inscripciones sin terminar no aparecen: todavía no se ha pedido nada sobre ellas.
      </p>

      <div className="barra-filtros">
        <label htmlFor="buscar-insc" className="visualmente-oculto">
          Buscar
        </label>
        <input
          id="buscar-insc"
          type="search"
          placeholder="Nombre, documento o correo…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />

        <label htmlFor="estado" className="visualmente-oculto">
          Filtrar por estado
        </label>
        <select
          id="estado"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as EnrollmentStatus | '');
            setPage(1);
          }}
        >
          <option value="">Todas las enviadas</option>
          {ENROLLMENT_STATUSES.filter((s) => s !== 'DRAFT').map((s) => (
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
                  <th>Pago</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {inbox.data.items.map((i) => (
                  <tr key={i.id}>
                    <td>
                      {i.applicantName}
                      <span className="tabla__secundario">{i.applicantDocument}</span>
                      {/* La cuenta se eliminó pero su inscripción sobrevive;
                          quien revisa necesita saberlo. */}
                      {i.applicantDeleted && (
                        <span className="etiqueta-rol">cuenta eliminada</span>
                      )}
                    </td>
                    <td>{i.programName ?? '—'}</td>
                    <td>{ESTADO_LABELS[i.status]}</td>
                    <td>
                      {i.paymentStatus === 'VERIFIED' ? (
                        <span className="pago pago--ok">Verificado</span>
                      ) : i.paymentOverdue ? (
                        <span className="pago pago--vencido">Vencido</span>
                      ) : (
                        <span className="pago">Pendiente</span>
                      )}
                    </td>
                    <td>
                      <Link to="/admin/aspirantes/$id" params={{ id: i.id }}>
                        Revisar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {inbox.data.items.length === 0 && <p>No hay inscripciones que coincidan.</p>}

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
