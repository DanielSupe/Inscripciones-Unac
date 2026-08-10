/**
 * Compone las opciones de conexión a partir de una URL.
 *
 * El adaptador de driver de Prisma 7 recibe la cadena tal cual y se la pasa a
 * `pg`, que **ignora el parámetro `?schema=`**: ese parámetro lo entiende
 * Prisma, no PostgreSQL. La CLI sí lo honra al migrar, así que el esquema y sus
 * tablas se crean donde toca, pero el cliente en ejecución escribiría en
 * `public` sin enterarse.
 *
 * Aquí se extrae y se le pasa al adaptador por su opción `schema`, que es la
 * que sí lo aplica. Sin esto, apuntar las pruebas a un esquema aparte parece
 * funcionar y en realidad no aísla nada.
 */
export function parseDatabaseUrl(url: string): { connectionString: string; schema: string } {
  try {
    const parsed = new URL(url);
    const schema = parsed.searchParams.get('schema') ?? 'public';
    return { connectionString: url, schema };
  } catch {
    return { connectionString: url, schema: 'public' };
  }
}
