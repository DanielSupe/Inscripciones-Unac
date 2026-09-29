import { z } from 'zod';
import { enrollmentStatusSchema, paymentStatusSchema } from './domain';

/**
 * Indicadores del inicio del panel de administración.
 *
 * El embudo y los pagos son registros con un enum como clave: Zod exige todas
 * las claves, así que el service no puede omitir un estado vacío y el frontend
 * puede recorrerlos sin comprobar ausencias.
 */
export const adminDashboardSchema = z.object({
  goal: z.object({
    /** Suma de las metas de las facultades que tienen una; `null` si ninguna. */
    globalTarget: z.number().int().nullable(),
    /** Matriculados de las facultades con meta: lo único comparable con la meta global. */
    enrolledTowardGoal: z.number().int(),
    progressPercent: z.number().int().nullable(),
    /** Matriculados de todas las facultades activas, tengan meta o no. */
    totalEnrolled: z.number().int(),
    facultiesWithoutGoal: z.number().int(),
  }),
  funnel: z.record(enrollmentStatusSchema, z.number().int()),
  payments: z.record(paymentStatusSchema, z.number().int()),
});
export type AdminDashboard = z.infer<typeof adminDashboardSchema>;
export type DashboardGoal = AdminDashboard['goal'];
