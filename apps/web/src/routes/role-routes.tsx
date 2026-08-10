import { Link } from '@tanstack/react-router';
import type { SessionUser } from '@repo/contracts';
import {
  useCatalog,
  useCurrentEnrollment,
  useStartEnrollment,
} from '../features/enrollment/api/enrollment-queries';
import { EnrollmentWizard } from '../features/enrollment/components/enrollment-wizard';
import { ProcessPanel } from '../features/enrollment/components/process-panel';
import { ReceiptPanel } from '../features/enrollment/components/receipt-panel';

function Cargando() {
  return (
    <p className="estado estado--cargando" role="status">
      Cargando…
    </p>
  );
}

/**
 * Cuando no hay periodo abierto se dice, en lugar de mostrar un formulario que
 * nadie podría enviar.
 */
function SinPeriodo() {
  return (
    <div className="estado estado--degradado" role="status">
      <p>
        <strong>No hay inscripciones abiertas</strong>
      </p>
      <p>
        En este momento no hay ningún periodo de inscripciones abierto. Vuelve más adelante.
      </p>
    </div>
  );
}

/** Pantalla de inicio del aspirante: el estado de su proceso. */
export function ApplicantHome() {
  const enrollment = useCurrentEnrollment();
  const catalog = useCatalog();
  const start = useStartEnrollment();

  if (enrollment.isPending || catalog.isPending) return <Cargando />;

  if (enrollment.data) return <ProcessPanel enrollment={enrollment.data} />;

  if (!catalog.data?.openPeriod) {
    return (
      <>
        <h1>Mi proceso</h1>
        <SinPeriodo />
      </>
    );
  }

  return (
    <>
      <h1>Mi proceso</h1>
      <p className="subtitulo">
        Todavía no has empezado tu inscripción para el periodo {catalog.data.openPeriod.code}.
      </p>
      <button
        type="button"
        className="boton boton--primario"
        onClick={() => void start.mutateAsync()}
        disabled={start.isPending}
      >
        {start.isPending ? 'Preparando…' : 'Empezar mi inscripción'}
      </button>
    </>
  );
}

/** El wizard. Si la inscripción ya fue enviada, no se puede volver a editar. */
export function ApplicantEnrollment() {
  const enrollment = useCurrentEnrollment();

  if (enrollment.isPending) return <Cargando />;

  if (!enrollment.data) {
    return (
      <>
        <h1>Inscripción</h1>
        <p>
          Todavía no has empezado. <Link to="/aspirante">Empieza desde tu proceso</Link>.
        </p>
      </>
    );
  }

  if (enrollment.data.status !== 'DRAFT') {
    return <ProcessPanel enrollment={enrollment.data} />;
  }

  return <EnrollmentWizard enrollment={enrollment.data} />;
}

export function ApplicantReceipt() {
  const enrollment = useCurrentEnrollment();

  if (enrollment.isPending) return <Cargando />;
  if (!enrollment.data) {
    return (
      <>
        <h1>Recibo de pago</h1>
        <p className="aviso-caja aviso-caja--info" role="status">
          Tu recibo se emite cuando termines y envíes tu inscripción.
        </p>
      </>
    );
  }

  return <ReceiptPanel enrollment={enrollment.data} />;
}

/** El estudiante ve lo mismo, en solo lectura: su proceso ya terminó. */
export function StudentHome() {
  const enrollment = useCurrentEnrollment();

  if (enrollment.isPending) return <Cargando />;
  if (!enrollment.data) {
    return (
      <>
        <h1>Mi inscripción</h1>
        <p>No encontramos una inscripción asociada a tu cuenta.</p>
      </>
    );
  }

  return <ProcessPanel enrollment={enrollment.data} />;
}

export function StudentReceipt() {
  return <ApplicantReceipt />;
}

export function AdminHome({ session }: { session: SessionUser }) {
  return (
    <>
      <h1>Panel de administración</h1>
      <p className="subtitulo">
        Desde aquí gestionarás usuarios, aspirantes y periodos académicos.
      </p>

      <dl className="ficha">
        <dt>Correo</dt>
        <dd>{session.email}</dd>
        <dt>Documento</dt>
        <dd>
          {session.documentType} {session.documentNumber}
        </dd>
      </dl>
    </>
  );
}
