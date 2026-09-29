import { z } from 'zod';

/**
 * Meta de matriculados de una facultad.
 *
 * El mínimo es 1 y no 0 a propósito: «sin meta» se expresa borrando la meta,
 * no guardando un cero. Si el cero fuera válido, una facultad sin meta y una
 * con meta cero se leerían igual en la tabla y significarían cosas distintas.
 */
export const setFacultyGoalSchema = z.object({
  target: z
    .number({ message: 'La meta debe ser un número.' })
    .int('La meta debe ser un número entero.')
    .min(1, 'La meta debe ser al menos 1.'),
});
export type SetFacultyGoalRequest = z.infer<typeof setFacultyGoalSchema>;

/**
 * Una fila del reporte de avance.
 *
 * `target` y `progressPercent` van juntos en su nulabilidad: sin meta no hay
 * porcentaje que calcular, y un 0 ahí se leería como «no lleva ninguno».
 */
export const facultyGoalRowSchema = z.object({
  facultyId: z.string(),
  facultyName: z.string(),
  target: z.number().int().nullable(),
  enrolledCount: z.number().int(),
  progressPercent: z.number().int().nullable(),
});
export type FacultyGoalRow = z.infer<typeof facultyGoalRowSchema>;
