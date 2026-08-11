import {
  ENROLLMENT_STEPS,
  ENROLLMENT_STEP_LABELS,
  type EnrollmentStep,
} from '@repo/contracts';

/**
 * Los tres pasos viviendo sobre una línea que se llena al avanzar.
 *
 * La línea no es adorno: dice cuánto falta, que es la única pregunta que se
 * hace quien está a mitad de un trámite. Y el orden importa de verdad —no se
 * puede enviar sin los tres, y al retomar se vuelve al primero pendiente—, así
 * que numerarlos dice algo cierto en vez de decorar.
 */
export function ProgressRail({
  actual,
  pendientes,
  onIr,
}: {
  actual: EnrollmentStep;
  pendientes: readonly EnrollmentStep[];
  onIr: (paso: EnrollmentStep) => void;
}) {
  const completados = ENROLLMENT_STEPS.filter((s) => !pendientes.includes(s)).length;
  const avance = (completados / ENROLLMENT_STEPS.length) * 100;

  return (
    <nav className="rail" aria-label="Pasos de la inscripción">
      <div className="rail__via" aria-hidden="true">
        <div className="rail__avance" style={{ width: `${String(avance)}%` }} />
      </div>

      <ol className="rail__pasos">
        {ENROLLMENT_STEPS.map((paso, i) => {
          const listo = !pendientes.includes(paso);
          const aqui = paso === actual;

          return (
            <li key={paso}>
              <button
                type="button"
                className={`rail__paso ${aqui ? 'rail__paso--aqui' : ''} ${listo ? 'rail__paso--listo' : ''}`}
                aria-current={aqui ? 'step' : undefined}
                onClick={() => { onIr(paso); }}
              >
                <span className="rail__marca">{listo ? '✓' : i + 1}</span>
                <span className="rail__nombre">{ENROLLMENT_STEP_LABELS[paso]}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
