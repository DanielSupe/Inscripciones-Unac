import { useState, type FormEvent } from 'react';
import {
  MODALITIES,
  MODALITY_LABELS,
  SEXES,
  SEX_LABELS,
  SHIFTS,
  SHIFT_LABELS,
  academicStepSchema,
  aspirationStepSchema,
  personalStepSchema,
  type AcademicProgram,
  type EnrollmentDraft,
} from '@repo/contracts';
import { Field } from './field';
import { invalidProps } from './field-props';

type Errors = Record<string, string>;

/** Traduce los problemas del esquema a un mensaje por campo. */
function toErrors(issues: readonly { path: readonly PropertyKey[]; message: string }[]): Errors {
  const result: Errors = {};
  for (const issue of issues) {
    result[issue.path.map(String).join('.')] ??= issue.message;
  }
  return result;
}

interface StepProps {
  data: EnrollmentDraft;
  onSave: (draft: EnrollmentDraft) => Promise<void>;
  saving: boolean;
}

/**
 * Los pasos validan con el mismo esquema que el backend, así que el formulario
 * no puede exigir algo distinto de lo que el API acepta ni al revés.
 */
export function PersonalStep({ data, onSave, saving }: StepProps) {
  const [errors, setErrors] = useState<Errors>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = personalStepSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success) {
      setErrors(toErrors(parsed.error.issues));
      return;
    }
    setErrors({});
    await onSave(parsed.data);
  }

  return (
    <form className="formulario" onSubmit={(e) => void handleSubmit(e)} noValidate>
      <Field id="firstName" label="Nombres" error={errors['firstName']}>
        <input id="firstName" name="firstName" defaultValue={data.firstName ?? ''} {...invalidProps('firstName', errors['firstName'])} />
      </Field>
      <Field id="lastName" label="Apellidos" error={errors['lastName']}>
        <input id="lastName" name="lastName" defaultValue={data.lastName ?? ''} {...invalidProps('lastName', errors['lastName'])} />
      </Field>
      <Field id="birthDate" label="Fecha de nacimiento" error={errors['birthDate']}>
        <input id="birthDate" name="birthDate" type="date" defaultValue={data.birthDate ?? ''} {...invalidProps('birthDate', errors['birthDate'])} />
      </Field>
      <Field id="sex" label="Sexo" error={errors['sex']}>
        <select id="sex" name="sex" defaultValue={data.sex ?? ''} {...invalidProps('sex', errors['sex'])}>
          <option value="">Selecciona…</option>
          {SEXES.map((s) => (
            <option key={s} value={s}>
              {SEX_LABELS[s]}
            </option>
          ))}
        </select>
      </Field>
      <Field id="phone" label="Teléfono" error={errors['phone']}>
        <input id="phone" name="phone" inputMode="tel" defaultValue={data.phone ?? ''} {...invalidProps('phone', errors['phone'])} />
      </Field>
      <Field id="city" label="Ciudad" error={errors['city']}>
        <input id="city" name="city" defaultValue={data.city ?? ''} {...invalidProps('city', errors['city'])} />
      </Field>
      <Field id="department" label="Departamento" error={errors['department']}>
        <input id="department" name="department" defaultValue={data.department ?? ''} {...invalidProps('department', errors['department'])} />
      </Field>

      <button type="submit" disabled={saving}>
        {saving ? 'Guardando…' : 'Guardar y continuar'}
      </button>
    </form>
  );
}

export function AcademicStep({ data, onSave, saving }: StepProps) {
  const [errors, setErrors] = useState<Errors>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = academicStepSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success) {
      setErrors(toErrors(parsed.error.issues));
      return;
    }
    setErrors({});
    await onSave(parsed.data);
  }

  return (
    <form className="formulario" onSubmit={(e) => void handleSubmit(e)} noValidate>
      <Field id="previousSchool" label="Colegio de origen" error={errors['previousSchool']}>
        <input id="previousSchool" name="previousSchool" defaultValue={data.previousSchool ?? ''} {...invalidProps('previousSchool', errors['previousSchool'])} />
      </Field>
      <Field id="graduationYear" label="Año de graduación" error={errors['graduationYear']}>
        <input id="graduationYear" name="graduationYear" inputMode="numeric" defaultValue={data.graduationYear ?? ''} {...invalidProps('graduationYear', errors['graduationYear'])} />
      </Field>
      <Field id="icfesRegistration" label="Número de registro ICFES" error={errors['icfesRegistration']} help="Aparece en tu certificado de resultados, empieza por AC.">
        <input id="icfesRegistration" name="icfesRegistration" defaultValue={data.icfesRegistration ?? ''} {...invalidProps('icfesRegistration', errors['icfesRegistration'])} />
      </Field>
      <Field id="icfesScore" label="Puntaje global ICFES" error={errors['icfesScore']} help="De 0 a 500.">
        <input id="icfesScore" name="icfesScore" inputMode="numeric" defaultValue={data.icfesScore ?? ''} {...invalidProps('icfesScore', errors['icfesScore'])} />
      </Field>

      <button type="submit" disabled={saving}>
        {saving ? 'Guardando…' : 'Guardar y continuar'}
      </button>
    </form>
  );
}

export function AspirationStep({
  data,
  onSave,
  saving,
  programs,
}: StepProps & { programs: AcademicProgram[] }) {
  const [errors, setErrors] = useState<Errors>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = aspirationStepSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success) {
      setErrors(toErrors(parsed.error.issues));
      return;
    }
    setErrors({});
    await onSave(parsed.data);
  }

  return (
    <form className="formulario" onSubmit={(e) => void handleSubmit(e)} noValidate>
      <Field id="programId" label="Programa académico" error={errors['programId']}>
        <select id="programId" name="programId" defaultValue={data.programId ?? ''} {...invalidProps('programId', errors['programId'])}>
          <option value="">Selecciona…</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </Field>
      <Field id="shift" label="Jornada" error={errors['shift']}>
        <select id="shift" name="shift" defaultValue={data.shift ?? ''} {...invalidProps('shift', errors['shift'])}>
          <option value="">Selecciona…</option>
          {SHIFTS.map((s) => (
            <option key={s} value={s}>
              {SHIFT_LABELS[s]}
            </option>
          ))}
        </select>
      </Field>
      <Field id="modality" label="Modalidad" error={errors['modality']}>
        <select id="modality" name="modality" defaultValue={data.modality ?? ''} {...invalidProps('modality', errors['modality'])}>
          <option value="">Selecciona…</option>
          {MODALITIES.map((m) => (
            <option key={m} value={m}>
              {MODALITY_LABELS[m]}
            </option>
          ))}
        </select>
      </Field>

      <button type="submit" disabled={saving}>
        {saving ? 'Guardando…' : 'Guardar y continuar'}
      </button>
    </form>
  );
}
