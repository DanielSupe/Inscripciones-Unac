-- Añade el diploma de bachiller al catálogo de documentos exigidos.
-- Postgres no permite usar un valor de enum recién añadido en la misma
-- transacción que lo crea, así que va en su propia sentencia.
ALTER TYPE "AttachmentType" ADD VALUE 'DIPLOMA';

-- Elimina los datos académicos que el aspirante tecleaba y que ya vienen en el
-- certificado del ICFES que adjunta. DESTRUCTIVA: estas columnas se pierden.
ALTER TABLE "enrollments" DROP COLUMN "graduationYear",
DROP COLUMN "icfesRegistration",
DROP COLUMN "icfesScore",
DROP COLUMN "previousSchool";
