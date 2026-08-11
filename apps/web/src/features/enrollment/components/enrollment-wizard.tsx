import { useState } from 'react';
import {
  ENROLLMENT_STEPS,
  ENROLLMENT_STEP_LABELS,
  type Enrollment,
  type EnrollmentDraft,
  type EnrollmentStep,
} from '@repo/contracts';
import { ApiRequestError } from '../../../lib/http';
import { useCatalog, useSaveDraft, useSubmitEnrollment } from '../api/enrollment-queries';
import { AspirationStep, PersonalStep } from './steps';
import { DocumentsStep } from './documents-step';
import { ProgressRail } from './progress-rail';

/** El primer paso que le falta, o el último si ya está todo. */
function primerPendiente(enrollment: Enrollment): EnrollmentStep {
  return enrollment.pendingSteps[0] ?? 'documents';
}

const TITULOS: Record<EnrollmentStep, string> = {
  personal: 'Cuéntanos quién eres',
  aspiration: '¿Qué quieres estudiar?',
  documents: 'Sube tus documentos',
};

export function EnrollmentWizard({ enrollment }: { enrollment: Enrollment }) {
  // Se abre donde la persona lo dejó, no siempre en el primero.
  const [step, setStep] = useState<EnrollmentStep>(() => primerPendiente(enrollment));
  const [error, setError] = useState<string | null>(null);

  const catalog = useCatalog();
  const save = useSaveDraft(enrollment.id);
  const submit = useSubmitEnrollment(enrollment.id);

  function avanzar(desde: EnrollmentStep): void {
    const siguiente = ENROLLMENT_STEPS[ENROLLMENT_STEPS.indexOf(desde) + 1];
    if (siguiente) setStep(siguiente);
  }

  async function guardar(draft: EnrollmentDraft, desde: EnrollmentStep): Promise<void> {
    setError(null);
    try {
      await save.mutateAsync(draft);
      avanzar(desde);
    } catch (cause) {
      setError(cause instanceof ApiRequestError ? cause.message : 'No se pudo guardar.');
    }
  }

  async function enviar(): Promise<void> {
    setError(null);
    try {
      await submit.mutateAsync();
    } catch (cause) {
      setError(
        cause instanceof ApiRequestError ? cause.message : 'No se pudo enviar tu inscripción.',
      );
    }
  }

  const listo = enrollment.pendingSteps.length === 0;

  return (
    <div className="inscripcion">
      <header className="inscripcion__cabecera">
        <p className="inscripcion__eyebrow">Periodo {enrollment.period.code}</p>
        <h1>Tu inscripción</h1>
        <p className="inscripcion__intro">
          Son tres pasos. Puedes salir cuando quieras: lo que guardes te espera aquí.
        </p>
      </header>

      <ProgressRail actual={step} pendientes={enrollment.pendingSteps} onIr={setStep} />

      <section className="inscripcion__panel" aria-labelledby="titulo-paso">
        <h2 id="titulo-paso">{TITULOS[step]}</h2>

        {error && (
          <p className="aviso-caja aviso-caja--error" role="alert">
            {error}
          </p>
        )}

        {step === 'personal' && (
          <PersonalStep
            data={enrollment.data}
            saving={save.isPending}
            onSave={(d) => guardar(d, 'personal')}
          />
        )}

        {step === 'aspiration' && (
          <AspirationStep
            data={enrollment.data}
            saving={save.isPending}
            programs={catalog.data?.programs ?? []}
            onSave={(d) => guardar(d, 'aspiration')}
          />
        )}

        {step === 'documents' && (
          <>
            <DocumentsStep enrollmentId={enrollment.id} attachments={enrollment.attachments} />

            <footer className="inscripcion__envio">
              {listo ? (
                <p className="inscripcion__listo">
                  Ya está todo. Al enviar te emitiremos el recibo de pago.
                </p>
              ) : (
                <p className="inscripcion__falta">
                  Te falta:{' '}
                  {enrollment.pendingSteps.map((s) => ENROLLMENT_STEP_LABELS[s]).join(' · ')}
                </p>
              )}

              <button
                type="button"
                className="boton boton--primario boton--grande"
                disabled={!listo || submit.isPending}
                onClick={() => void enviar()}
              >
                {submit.isPending ? 'Enviando…' : 'Enviar inscripción'}
              </button>
            </footer>
          </>
        )}
      </section>
    </div>
  );
}
