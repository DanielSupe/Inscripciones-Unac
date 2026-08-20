import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import {
  ATTACHMENT_TYPE_LABELS,
  MODALITY_LABELS,
  SEX_LABELS,
  SHIFT_LABELS,
} from '@repo/contracts';
import { ApiRequestError } from '../../../lib/http';
import {
  useEnrollmentDetail,
  useHandOver,
  useReject,
  useTakeForReview,
  useVerifyPayment,
} from '../api/admin-queries';
import { InterviewCard } from '../../enrollment/components/interview-card';
import { ESTADO_LABELS } from './estado-labels';
import { DocumentViewer } from '../../enrollment/components/document-viewer';
import { useDocumentViewer } from '../../enrollment/components/use-document-viewer';

const dinero = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

export function ReviewDetail({ enrollmentId }: { enrollmentId: string }) {
  const detail = useEnrollmentDetail(enrollmentId);
  const take = useTakeForReview(enrollmentId);
  const handOver = useHandOver(enrollmentId);
  const reject = useReject(enrollmentId);
  const verify = useVerifyPayment(enrollmentId);

  const visor = useDocumentViewer();
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState<string | null>(null);

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
  const pagoVerificado = e.receipt?.status === 'VERIFIED';
  // Lo que el administrador aún puede tocar termina al entregar: de ahí en
  // adelante mira, pero no interviene.
  const enSusManos = e.status === 'SUBMITTED' || e.status === 'UNDER_REVIEW';
  const faltanDatos = e.pendingSteps.length > 0;

  return (
    <>
      <p>
        <Link to="/admin/aspirantes">← Volver a la bandeja</Link>
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

      <h2>Pago</h2>
      {e.receipt ? (
        <div className={`estado ${pagoVerificado ? 'estado--ok' : 'estado--degradado'}`}>
          <p>
            <strong>{e.receipt.receiptNumber}</strong> · {dinero.format(e.receipt.amount)}
          </p>
          <p>
            {pagoVerificado
              ? 'Pago verificado.'
              : e.receipt.isOverdue
                ? `Pendiente y vencido el ${new Date(e.receipt.dueAt).toLocaleDateString('es-CO')}.`
                : `Pendiente. Vence el ${new Date(e.receipt.dueAt).toLocaleDateString('es-CO')}.`}
          </p>
          <button
            type="button"
            onClick={() => void ejecutar(() => verify.mutateAsync(!pagoVerificado))}
            disabled={verify.isPending}
          >
            {pagoVerificado ? 'Deshacer verificación' : 'Marcar pago verificado'}
          </button>
        </div>
      ) : (
        <p>Todavía no se ha emitido recibo.</p>
      )}

      {e.interview && (
        <>
          <h2>Entrevista</h2>
          <InterviewCard interview={e.interview} />
        </>
      )}

      {enSusManos && (
        <>
          <h2>Trámite</h2>

          {e.status === 'SUBMITTED' && (
            <p>
              <button
                type="button"
                onClick={() => void ejecutar(() => take.mutateAsync())}
                disabled={take.isPending}
              >
                Tomar para revisión
              </button>
            </p>
          )}

          {e.status === 'UNDER_REVIEW' && (
            <>
              <div className="decision">
                <button
                  type="button"
                  className="boton boton--primario"
                  onClick={() => void ejecutar(() => handOver.mutateAsync())}
                  disabled={!pagoVerificado || faltanDatos || handOver.isPending}
                >
                  Entregar a la facultad
                </button>
                {!pagoVerificado && (
                  <span className="campo__ayuda">
                    No se puede entregar hasta verificar el pago.
                  </span>
                )}
                {faltanDatos && (
                  <span className="campo__ayuda">
                    Le faltan datos o documentos a la inscripción.
                  </span>
                )}
              </div>

              <label htmlFor="motivo">Motivo del rechazo</label>
              <textarea
                id="motivo"
                rows={3}
                value={motivo}
                onChange={(ev) => { setMotivo(ev.target.value); }}
                placeholder="Explica qué debe corregir el aspirante…"
              />
              <button
                type="button"
                onClick={() => void ejecutar(() => reject.mutateAsync({ reason: motivo }))}
                disabled={motivo.trim().length < 10 || reject.isPending}
              >
                Rechazar por trámite
              </button>
            </>
          )}
        </>
      )}

      {!enSusManos && e.status !== 'APPROVED' && e.status !== 'REJECTED' && (
        <p className="campo__ayuda">
          Esta inscripción está en manos de la facultad. Puedes seguirla, pero la decisión es del
          decano.
        </p>
      )}

      {visor.abierto && (
        <DocumentViewer
          enrollmentId={e.id}
          attachment={e.attachments.find((a) => a.type === visor.abierto)!}
          onClose={visor.cerrar}
        />
      )}

      {e.status === 'REJECTED' && e.rejectionReason && (
        <div className="aviso-caja aviso-caja--error">
          <strong>Rechazada:</strong> {e.rejectionReason}
        </div>
      )}
    </>
  );
}
