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
import { AcademicStep, AspirationStep, PersonalStep } from './steps';
import { DocumentsStep } from './documents-step';

/** El primer paso que le falta, o el último si ya está todo. */
function firstPendingStep(enrollment: Enrollment): EnrollmentStep {
  return enrollment.pendingSteps[0] ?? 'documents';
}

export function EnrollmentWizard({ enrollment }: { enrollment: Enrollment }) {
  // Se abre donde la persona lo dejó, no siempre en el primero.
  const [step, setStep] = useState<EnrollmentStep>(() => firstPendingStep(enrollment));
  const [error, setError] = useState<string | null>(null);

  const catalog = useCatalog();
  const save = useSaveDraft(enrollment.id);
  const submit = useSubmitEnrollment(enrollment.id);

  function advance(from: EnrollmentStep): void {
    const next = ENROLLMENT_STEPS[ENROLLMENT_STEPS.indexOf(from) + 1];
    if (next) setStep(next);
  }

  async function handleSave(draft: EnrollmentDraft, from: EnrollmentStep): Promise<void> {
    setError(null);
    try {
      await save.mutateAsync(draft);
      advance(from);
    } catch (cause) {
      setError(cause instanceof ApiRequestError ? cause.message : 'No se pudo guardar.');
    }
  }

  async function handleSubmit(): Promise<void> {
    setError(null);
    try {
      await submit.mutateAsync();
    } catch (cause) {
      setError(
        cause instanceof ApiRequestError ? cause.message : 'No se pudo enviar tu inscripción.',
      );
    }
  }

  const pendientes = new Set(enrollment.pendingSteps);

  return (
    <>
      <h1>Inscripción</h1>
      <p className="subtitulo">
        Periodo {enrollment.period.code}. Puedes salir y volver cuando quieras: lo que guardes
        se conserva.
      </p>

      <ol className="pasos" aria-label="Pasos de la inscripción">
        {ENROLLMENT_STEPS.map((s, i) => (
          <li key={s}>
            <button
              type="button"
              className={`pasos__paso ${s === step ? 'pasos__paso--activo' : ''}`}
              aria-current={s === step ? 'step' : undefined}
              onClick={() => {
                setStep(s);
              }}
            >
              <span className="pasos__numero">{i + 1}</span>
              <span>{ENROLLMENT_STEP_LABELS[s]}</span>
              {!pendientes.has(s) && <span className="pasos__ok">✓</span>}
            </button>
          </li>
        ))}
      </ol>

      {error && (
        <p className="aviso-caja aviso-caja--error" role="alert">
          {error}
        </p>
      )}

      {step === 'personal' && (
        <PersonalStep
          data={enrollment.data}
          saving={save.isPending}
          onSave={(d) => handleSave(d, 'personal')}
        />
      )}

      {step === 'academic' && (
        <AcademicStep
          data={enrollment.data}
          saving={save.isPending}
          onSave={(d) => handleSave(d, 'academic')}
        />
      )}

      {step === 'aspiration' && (
        <AspirationStep
          data={enrollment.data}
          saving={save.isPending}
          programs={catalog.data?.programs ?? []}
          onSave={(d) => handleSave(d, 'aspiration')}
        />
      )}

      {step === 'documents' && (
        <>
          <DocumentsStep
            enrollmentId={enrollment.id}
            attachments={enrollment.attachments}
            onContinue={() => void handleSubmit()}
          />

          {enrollment.pendingSteps.length > 0 && (
            <p className="aviso-caja aviso-caja--info">
              Para enviar te falta:{' '}
              {enrollment.pendingSteps.map((s) => ENROLLMENT_STEP_LABELS[s]).join(', ')}.
            </p>
          )}

          <button
            type="button"
            className="boton boton--primario"
            disabled={enrollment.pendingSteps.length > 0 || submit.isPending}
            onClick={() => void handleSubmit()}
          >
            {submit.isPending ? 'Enviando…' : 'Enviar inscripción'}
          </button>
        </>
      )}
    </>
  );
}
