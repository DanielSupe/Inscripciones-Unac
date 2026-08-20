-- Se renombró de 223413 a 223700 para que ordene DESPUÉS de la migración que
-- crea el tipo `AttachmentType` y la tabla `enrollments`. Con la marca de
-- tiempo anterior el historial no se podía reproducir desde cero: una base de
-- datos nueva fallaba aquí, y solo se veía al construir una, nunca al migrar
-- de forma incremental la que ya existía.

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
