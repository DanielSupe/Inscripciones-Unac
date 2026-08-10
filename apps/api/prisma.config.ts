// Prisma 7 sacó la cadena de conexión del esquema y dejó de cargar `.env` por
// su cuenta, así que el archivo se carga aquí explícitamente. Este archivo lo
// consume la CLI de Prisma (`migrate`, `db`, `studio`), no la aplicación.
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
  migrations: {
    seed: 'tsx --env-file=.env prisma/seed.ts',
  },
});
