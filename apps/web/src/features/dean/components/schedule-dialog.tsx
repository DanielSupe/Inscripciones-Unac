import { useState, type FormEvent } from 'react';
import {
  INTERVIEW_MODALITIES,
  INTERVIEW_MODALITY_LABELS,
  scheduleInterviewSchema,
  type Interview,
  type InterviewModality,
} from '@repo/contracts';
import { Modal } from '../../../components/modal';
import { ApiRequestError } from '../../../lib/http';
import { horaColombiaParaInput, isoDesdeHoraColombia } from '../../../lib/fechas';
import { useRescheduleInterview, useScheduleInterview } from '../api/dean-queries';

/**
 * Agendar y reagendar son el mismo formulario.
 *
 * Mover una cita no crea otra: es la misma en otro momento, así que pedir los
 * mismos datos con los valores ya puestos es lo que corresponde.
 */
export function ScheduleDialog({
  enrollmentId,
  interview,
  onClose,
}: {
  enrollmentId: string;
  /** Presente al reagendar; ausente al citar por primera vez. */
  interview?: Interview;
  onClose: () => void;
}) {
  const moviendo = interview !== undefined;
  const agendar = useScheduleInterview(enrollmentId);
  const reagendar = useRescheduleInterview(enrollmentId);

  const [modality, setModality] = useState<InterviewModality>(interview?.modality ?? 'ON_SITE');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setErrors({});

    const form = new FormData(event.currentTarget);
    const cuando = String(form.get('scheduledAt') ?? '');
    if (!cuando) {
      setErrors({ scheduledAt: 'Elige el día y la hora' });
      return;
    }

    const parsed = scheduleInterviewSchema.safeParse({
      scheduledAt: isoDesdeHoraColombia(cuando),
      modality,
      location: form.get('location') ?? undefined,
      meetingUrl: form.get('meetingUrl') ?? undefined,
    });

    if (!parsed.success) {
      const detalle: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        detalle[issue.path.map(String).join('.')] ??= issue.message;
      }
      setErrors(detalle);
      return;
    }

    try {
      await (moviendo ? reagendar : agendar).mutateAsync(parsed.data);
      onClose();
    } catch (cause) {
      setError(cause instanceof ApiRequestError ? cause.message : 'No se pudo guardar la cita.');
    }
  }

  const guardando = agendar.isPending || reagendar.isPending;

  return (
    <Modal label={moviendo ? 'Mover la entrevista' : 'Agendar la entrevista'} onClose={onClose}>
      <form className="formulario" onSubmit={(e) => void handleSubmit(e)} noValidate>
        {error && (
          <p className="aviso-caja aviso-caja--error" role="alert">
            {error}
          </p>
        )}

        <label htmlFor="scheduledAt">Día y hora</label>
        <input
          id="scheduledAt"
          name="scheduledAt"
          type="datetime-local"
          defaultValue={interview ? horaColombiaParaInput(interview.scheduledAt) : ''}
        />
        <span className="campo__ayuda">En hora de Colombia.</span>
        {errors['scheduledAt'] && <span className="campo__error">{errors['scheduledAt']}</span>}

        <label htmlFor="modality">Modalidad</label>
        <select
          id="modality"
          name="modality"
          value={modality}
          onChange={(e) => { setModality(e.target.value as InterviewModality); }}
        >
          {INTERVIEW_MODALITIES.map((m) => (
            <option key={m} value={m}>
              {INTERVIEW_MODALITY_LABELS[m]}
            </option>
          ))}
        </select>

        {/* La modalidad decide qué se pide. Enseñar los dos campos dejaría que
            se guardara una cita virtual con una dirección física. */}
        {modality === 'ON_SITE' ? (
          <>
            <label htmlFor="location">Lugar</label>
            <input
              id="location"
              name="location"
              defaultValue={interview?.location ?? ''}
              placeholder="Bloque administrativo, oficina 201"
            />
            {errors['location'] && <span className="campo__error">{errors['location']}</span>}
          </>
        ) : (
          <>
            <label htmlFor="meetingUrl">Enlace de la reunión</label>
            <input
              id="meetingUrl"
              name="meetingUrl"
              defaultValue={interview?.meetingUrl ?? ''}
              placeholder="https://…"
            />
            {errors['meetingUrl'] && <span className="campo__error">{errors['meetingUrl']}</span>}
          </>
        )}

        <div className="modal__pie">
          <button type="submit" className="boton boton--primario" disabled={guardando}>
            {guardando ? 'Guardando…' : moviendo ? 'Mover la cita' : 'Agendar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
