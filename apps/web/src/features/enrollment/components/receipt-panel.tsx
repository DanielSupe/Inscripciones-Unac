import type { Enrollment } from '@repo/contracts';
import { config } from '../../../lib/config';

const dinero = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});
const fecha = new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' });

export function ReceiptPanel({ enrollment }: { enrollment: Enrollment }) {
  const { receipt } = enrollment;

  if (!receipt) {
    return (
      <>
        <h1>Recibo de pago</h1>
        <p className="aviso-caja aviso-caja--info" role="status">
          Tu recibo se emite cuando termines y envíes tu inscripción.
        </p>
      </>
    );
  }

  const verificado = receipt.status === 'VERIFIED';

  return (
    <>
      <h1>Recibo de pago</h1>
      <p className="subtitulo">Derecho de inscripción · periodo {enrollment.period.code}</p>

      <div className={`estado ${verificado ? 'estado--ok' : 'estado--degradado'}`} role="status">
        <p>
          <strong>{verificado ? 'Pago verificado' : 'Pago pendiente'}</strong>
        </p>
        <p>
          {verificado
            ? 'Tu pago quedó registrado. Tu inscripción puede continuar su proceso.'
            : 'Presenta este recibo en el banco o en la tesorería. Tu inscripción no será revisada hasta que el pago quede verificado.'}
        </p>
      </div>

      <dl className="ficha">
        <dt>Número de recibo</dt>
        <dd>{receipt.receiptNumber}</dd>
        <dt>Valor</dt>
        <dd>
          <strong>{dinero.format(receipt.amount)}</strong>
        </dd>
        <dt>Emitido el</dt>
        <dd>{fecha.format(new Date(receipt.issuedAt))}</dd>
        <dt>Paga hasta</dt>
        <dd>{fecha.format(new Date(receipt.dueAt))}</dd>
        <dt>Programa</dt>
        <dd>{enrollment.program?.name ?? '—'}</dd>
      </dl>

      {/* Descarga directa: el PDF lo genera el API y viaja con la cookie de
          sesión, así que un enlace normal basta y no hace falta pasar por el
          cliente HTTP. */}
      <a
        className="boton boton--primario"
        href={`${config.VITE_API_URL}/enrollments/${enrollment.id}/receipt.pdf`}
      >
        Descargar en PDF
      </a>
    </>
  );
}
