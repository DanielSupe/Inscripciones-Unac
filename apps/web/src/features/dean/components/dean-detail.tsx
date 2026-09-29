import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import {
  ATTACHMENT_TYPE_LABELS,
  INTERVIEW_OUTCOME_LABELS,
  MODALITY_LABELS,
  SEX_LABELS,
  SHIFT_LABELS,
} from '@repo/contracts';
import { ApiRequestError } from '../../../lib/http';
import { fechaHoraColombia } from '../../../lib/fechas';
import { ESTADO_LABELS } from '../../admin/components/estado-labels';
import { DocumentViewer } from '../../enrollment/components/document-viewer';
import { InterviewCard } from '../../enrollment/components/interview-card';
import { useDocumentViewer } from '../../enrollment/components/use-document-viewer';
import {
  useDeanApprove,
  useDeanEnrollment,
  useDeanReject,
  useDeclareOutcome,
} from '../api/dean-queries';
import { ScheduleDialog } from './schedule-dialog';

export function DeanDetail({ enrollmentId }: { enrollmentId: string }) {
  const detail = useDeanEnrollment(enrollmentId);
  const approve = useDeanApprove(enrollmentId);
  const reject = useDeanReject(enrollmentId);
  const declarar = useDeclareOutcome(enrollmentId);

  const visor = useDocumentViewer();
  const [agendando, setAgendando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // El reloj se toma una vez al montar en vez de en cada render: leerlo al
  // pintar haría que los botones cambiaran solos en un re-render cualquiera.
  // Quien deje la pantalla abierta hasta pasada la cita recarga; y de todas
  // formas el servidor es quien decide, no este botón.
  const [montadoEn] = useState(() => Date.now());

  async function ejecutar(accion: () => Promise<unknown>) {
    setError(null);
    try {
      await accion();
    } catch (cause) {
      setError(cause instanceof ApiRequestError ? cause.message : 'No se pudo completar.');
    }
  }

  if (detail.isPending) return <p role="status">Cargando…</p>;
  if (!detail.data) return <p role="alert">No encontramos esa inscripción.</p>;

  const e = detail.data;
  const d = e.data;
  const resuelta = e.status === 'APPROVED' || e.status === 'REJECTED';
  // El decano decide en cualquier punto de su tramo, no solo con la entrevista
  // realizada: la decisión académica puede estar tomada antes de la cita.
  const enSuTramo =
    e.status === 'PENDING_INTERVIEW' ||
    e.status === 'INTERVIEW_SCHEDULED' ||
    e.status === 'INTERVIEW_HELD';
  const yaOcurrio = e.interview
    ? new Date(e.interview.scheduledAt).getTime() <= montadoEn
    : false;

  return (
    <>
      <p>
        <Link to="/facultad">← Volver a mi bandeja</Link>
      </p>

      <h1>
        {d.firstName} {d.lastName}
      </h1>
      <p className="subtitulo">
        {ESTADO_LABELS[e.status]} · {e.program?.name ?? 'Sin programa'} · periodo {e.period.code}
      </p>

      {error && (
        <p className="aviso-caja aviso-caja--error" role="alert">
          {error}
        </p>
      )}

      <h2>Datos declarados</h2>
      <dl className="ficha">
        <dt>Fecha de nacimiento</dt>
        <dd>{d.birthDate ?? '—'}</dd>
        <dt>Sexo</dt>
        <dd>{d.sex ? SEX_LABELS[d.sex] : '—'}</dd>
        <dt>Teléfono</dt>
        <dd>{d.phone ?? '—'}</dd>
        <dt>Ciudad</dt>
        <dd>
          {d.city ?? '—'}, {d.department ?? '—'}
        </dd>
        <dt>Jornada</dt>
        <dd>{d.shift ? SHIFT_LABELS[d.shift] : '—'}</dd>
        <dt>Modalidad</dt>
        <dd>{d.modality ? MODALITY_LABELS[d.modality] : '—'}</dd>
      </dl>

      <h2>Documentos</h2>
      <ul className="documentos">
        {e.attachments.map((a) => (
          <li key={a.type} className="documentos__item">
            <div>
              <p className="documentos__nombre">{ATTACHMENT_TYPE_LABELS[a.type]}</p>
              <p className="documentos__estado">{(a.sizeBytes / 1024).toFixed(0)} KB</p>
            </div>
            <button type="button" onClick={() => { visor.abrir(a.type); }}>
              Ver
            </button>
          </li>
        ))}
      </ul>

      <h2>Entrevista</h2>

      {e.interview ? (
        <>
          <InterviewCard interview={e.interview} />
          {!resuelta && (
            <div className="decision">
              <button type="button" onClick={() => { setAgendando(true); }}>
                Mover la cita
              </button>
              <button
                type="button"
                className="boton boton--primario"
                onClick={() => void ejecutar(() => declarar.mutateAsync('HELD'))}
                disabled={!yaOcurrio || declarar.isPending}
              >
                Se realizó
              </button>
              <button
                type="button"
                onClick={() => void ejecutar(() => declarar.mutateAsync('NO_SHOW'))}
                disabled={!yaOcurrio || declarar.isPending}
              >
                No se presentó
              </button>
              {!yaOcurrio && (
                <span className="campo__ayuda">
                  Podrás declarar el resultado cuando pase la hora de la cita.
                </span>
              )}
            </div>
          )}
        </>
      ) : (
        // Solo a la espera de fecha. Con la entrevista ya realizada no hay nada
        // que agendar, y ofrecerlo sería un botón que el servidor rechazaría.
        e.status === 'PENDING_INTERVIEW' && (
          <p>
            <button
              type="button"
              className="boton boton--primario"
              onClick={() => { setAgendando(true); }}
            >
              {e.pastInterviews.length > 0 ? 'Citar de nuevo' : 'Agendar entrevista'}
            </button>
          </p>
        )
      )}

      {/* El historial es lo que permite juzgar una segunda ausencia: sin él,
          la anterior sería solo un recuerdo de quien estuvo delante. */}
      {e.pastInterviews.length > 0 && (
        <ul className="historial">
          {e.pastInterviews.map((i) => (
            <li key={i.id}>
              {fechaHoraColombia(i.scheduledAt)} ·{' '}
              {i.outcome ? INTERVIEW_OUTCOME_LABELS[i.outcome] : ''}
            </li>
          ))}
        </ul>
      )}

      {!resuelta && (
        <>
          <h2>Decisión</h2>

          {/* Aprobar deja de estar protegido por el estado, así que la
              protección pasa a ser este paso de más: no hay deshacer, porque
              aprobar promueve a estudiante. */}
          <div className="decision">
            {confirmando ? (
              <div className="aviso-caja" role="alert">
                <p>
                  Vas a aprobar la inscripción de {d.firstName} {d.lastName}.{' '}
                  {e.interview
                    ? `La entrevista del ${fechaHoraColombia(e.interview.scheduledAt)} quedará sin efecto.`
                    : 'Pasará a ser estudiante sin entrevista.'}{' '}
                  Esto no se puede deshacer.
                </p>
                <button
                  type="button"
                  className="boton boton--primario"
                  onClick={() => {
                    setConfirmando(false);
                    void ejecutar(() => approve.mutateAsync());
                  }}
                  disabled={approve.isPending}
                >
                  Confirmar aprobación
                </button>
                <button type="button" onClick={() => { setConfirmando(false); }}>
                  Cancelar
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  className="boton boton--primario"
                  onClick={() => { setConfirmando(true); }}
                  disabled={!enSuTramo || approve.isPending}
                >
                  Aprobar
                </button>
                {!enSuTramo && (
                  <span className="campo__ayuda">
                    Solo puedes decidir cuando la inscripción esté en tu facultad.
                  </span>
                )}
              </>
            )}
          </div>

          <label className="motivo__etiqueta" htmlFor="motivo">
            Motivo del rechazo
          </label>
          <textarea
            className="motivo__texto"
            id="motivo"
            rows={3}
            value={motivo}
            onChange={(ev) => { setMotivo(ev.target.value); }}
            placeholder="Explica el motivo de la decisión…"
          />
          <button
            type="button"
            onClick={() => void ejecutar(() => reject.mutateAsync(motivo))}
            disabled={motivo.trim().length < 10 || reject.isPending}
          >
            Rechazar
          </button>
        </>
      )}

      {e.status === 'REJECTED' && e.rejectionReason && (
        <div className="aviso-caja aviso-caja--error">
          <strong>Rechazada:</strong> {e.rejectionReason}
        </div>
      )}

      {agendando && (
        <ScheduleDialog
          enrollmentId={e.id}
          {...(e.interview ? { interview: e.interview } : {})}
          onClose={() => { setAgendando(false); }}
        />
      )}

      {visor.abierto && (
        <DocumentViewer
          enrollmentId={e.id}
          attachment={e.attachments.find((a) => a.type === visor.abierto)!}
          onClose={visor.cerrar}
        />
      )}
    </>
  );
}
