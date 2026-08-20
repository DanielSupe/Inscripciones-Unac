import { INTERVIEW_OUTCOME_LABELS, type Interview } from '@repo/contracts';
import { fechaHoraColombia } from '../../../lib/fechas';

/**
 * La cita, tal como la ve quien tiene que presentarse a ella.
 *
 * Enseña el enlace como enlace y el lugar como texto: son dos cosas distintas y
 * tratarlas igual obligaría a la persona a adivinar si tiene que ir o conectarse.
 */
export function InterviewCard({ interview }: { interview: Interview }) {
  return (
    <div className="cita">
      <p className="cita__cuando">{fechaHoraColombia(interview.scheduledAt)}</p>

      {interview.modality === 'ON_SITE' ? (
        <p className="cita__donde">
          <strong>Preséntate en:</strong> {interview.location}
        </p>
      ) : (
        <p className="cita__donde">
          <strong>Conéctate a:</strong>{' '}
          {interview.meetingUrl && (
            <a href={interview.meetingUrl} target="_blank" rel="noopener noreferrer">
              {interview.meetingUrl}
            </a>
          )}
        </p>
      )}

      {interview.outcome && (
        <p className="cita__resultado">{INTERVIEW_OUTCOME_LABELS[interview.outcome]}</p>
      )}
    </div>
  );
}
