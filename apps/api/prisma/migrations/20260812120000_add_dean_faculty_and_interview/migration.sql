-- Etapa del decano y la entrevista de admisión.
--
-- El paso delicado es hacer obligatorio `facultyId` sobre programas que ya
-- existen: la columna nace nulable, se rellena cruzando por el código del
-- programa, y solo entonces se impone la restricción. Si algún programa quedara
-- sin facultad, la comprobación de más abajo aborta la migración antes de
-- tocar el esquema, en vez de dejarlo a medias.

-- AlterEnum: valores nuevos. No se usan en esta misma migración, así que
-- añadirlos aquí es seguro.
ALTER TYPE "Role" ADD VALUE 'DEAN';

ALTER TYPE "EnrollmentStatus" ADD VALUE 'PENDING_INTERVIEW';
ALTER TYPE "EnrollmentStatus" ADD VALUE 'INTERVIEW_SCHEDULED';
ALTER TYPE "EnrollmentStatus" ADD VALUE 'INTERVIEW_HELD';

-- CreateEnum
CREATE TYPE "InterviewModality" AS ENUM ('ON_SITE', 'VIRTUAL');

CREATE TYPE "InterviewOutcome" AS ENUM ('HELD', 'NO_SHOW');

-- CreateTable
CREATE TABLE "faculties" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deanUserId" TEXT,

    CONSTRAINT "faculties_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "faculties_code_key" ON "faculties"("code");

-- Único en las dos direcciones: nadie dirige dos facultades.
CREATE UNIQUE INDEX "faculties_deanUserId_key" ON "faculties"("deanUserId");

-- AddForeignKey
ALTER TABLE "faculties" ADD CONSTRAINT "faculties_deanUserId_fkey"
    FOREIGN KEY ("deanUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Las facultades de arranque. El seed las reconcilia después por su código, así
-- que ambos caminos convergen y no se duplican.
INSERT INTO "faculties" ("id", "code", "name") VALUES
    ('fac_teologia',       'TEO', 'Facultad de Teología'),
    ('fac_salud',          'SAL', 'Facultad de Ciencias de la Salud'),
    ('fac_ingenieria',     'ING', 'Facultad de Ingeniería'),
    ('fac_administrativas','ADM', 'Facultad de Ciencias Administrativas'),
    ('fac_educacion',      'EDU', 'Facultad de Educación y Artes');

-- AlterTable: nulable primero, para poder rellenarla.
ALTER TABLE "academic_programs" ADD COLUMN "facultyId" TEXT;

UPDATE "academic_programs" SET "facultyId" = 'fac_teologia'        WHERE "code" IN ('TEO');
UPDATE "academic_programs" SET "facultyId" = 'fac_salud'           WHERE "code" IN ('ENF', 'PSI');
UPDATE "academic_programs" SET "facultyId" = 'fac_ingenieria'      WHERE "code" IN ('ISI');
UPDATE "academic_programs" SET "facultyId" = 'fac_administrativas' WHERE "code" IN ('ADM', 'CON');
UPDATE "academic_programs" SET "facultyId" = 'fac_educacion'       WHERE "code" IN ('LIC', 'MUS');

-- Si algún programa quedó fuera del reparto, abortar en vez de imponer la
-- restricción sobre datos incompletos.
DO $$
DECLARE
    huerfanos TEXT;
BEGIN
    SELECT string_agg("code", ', ') INTO huerfanos
    FROM "academic_programs" WHERE "facultyId" IS NULL;

    IF huerfanos IS NOT NULL THEN
        RAISE EXCEPTION 'Estos programas no tienen facultad asignada: %. Añádelos al reparto de esta migración antes de continuar.', huerfanos;
    END IF;
END $$;

ALTER TABLE "academic_programs" ALTER COLUMN "facultyId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "academic_programs_facultyId_idx" ON "academic_programs"("facultyId");

-- AddForeignKey
ALTER TABLE "academic_programs" ADD CONSTRAINT "academic_programs_facultyId_fkey"
    FOREIGN KEY ("facultyId") REFERENCES "faculties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: quién decidió, separado de quién revisó.
ALTER TABLE "enrollments" ADD COLUMN "decidedAt" TIMESTAMP(3);
ALTER TABLE "enrollments" ADD COLUMN "decidedByUserId" TEXT;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_decidedByUserId_fkey"
    FOREIGN KEY ("decidedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "interviews" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "modality" "InterviewModality" NOT NULL,
    "location" TEXT,
    "meetingUrl" TEXT,
    "outcome" "InterviewOutcome",
    "closedAt" TIMESTAMP(3),
    "scheduledByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: encontrar la vigente sin recorrer el historial.
CREATE INDEX "interviews_enrollmentId_outcome_idx" ON "interviews"("enrollmentId", "outcome");

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_enrollmentId_fkey"
    FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "interviews" ADD CONSTRAINT "interviews_scheduledByUserId_fkey"
    FOREIGN KEY ("scheduledByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
