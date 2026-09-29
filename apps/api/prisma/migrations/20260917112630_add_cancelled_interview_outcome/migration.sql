-- La cita que la decisión dejó sin efecto.
--
-- El decano puede aprobar antes de que llegue la fecha; esa entrevista no se
-- borra —el historial de citas es lo que después justifica una decisión— ni se
-- marca como celebrada. Se cierra con este tercer desenlace.
--
-- AlterEnum aditivo: no reescribe filas y las entrevistas existentes conservan
-- su valor.
-- AlterEnum
ALTER TYPE "InterviewOutcome" ADD VALUE 'CANCELLED';
