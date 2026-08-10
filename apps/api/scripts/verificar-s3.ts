/**
 * Comprueba que el almacenamiento de documentos está bien configurado.
 *
 * Ejercita exactamente lo que hará la aplicación —firmar, subir, leer, borrar—
 * y además la respuesta CORS del bucket, que es lo único que no se puede
 * verificar desde el backend porque solo le concierne al navegador.
 *
 * Existe para que un bucket mal configurado falle aquí, en diez segundos y con
 * un mensaje claro, en vez de hacerlo tres capas más arriba disfrazado de otra
 * cosa.
 *
 *   pnpm --filter @repo/api run s3:check
 */
import { config as loadDotenv } from 'dotenv';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

loadDotenv({ path: '.env', quiet: true });

const REGION = process.env.S3_REGION ?? '';
const BUCKET = process.env.S3_BUCKET ?? '';
const ORIGEN_FRONTEND = process.env.CORS_ORIGIN ?? 'http://localhost:5173';
const CLAVE = `verificacion/prueba-${Date.now()}.txt`;
const CONTENIDO = 'sion-ok-1234';

let fallos = 0;

function ok(mensaje: string): void {
  console.warn(`  ✓ ${mensaje}`);
}

function error(mensaje: string, detalle?: string): void {
  fallos += 1;
  console.error(`  ✗ ${mensaje}`);
  if (detalle) console.error(`      ${detalle}`);
}

function faltante(nombre: string): boolean {
  if (!process.env[nombre]) {
    error(`Falta ${nombre} en apps/api/.env`);
    return true;
  }
  return false;
}

async function main(): Promise<void> {
  console.warn('\nComprobando el almacenamiento de documentos\n');

  const requeridas = ['S3_REGION', 'S3_BUCKET', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'];
  if (requeridas.map(faltante).some(Boolean)) {
    console.error('\nNo se puede continuar sin la configuración.\n');
    process.exit(1);
  }
  console.warn(`  bucket: ${BUCKET}   región: ${REGION}   origen: ${ORIGEN_FRONTEND}\n`);

  const s3 = new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
    },
  });

  // 1 — Firmar una subida. Falla si la credencial está mal formada.
  let urlSubida = '';
  try {
    urlSubida = await getSignedUrl(
      s3,
      new PutObjectCommand({ Bucket: BUCKET, Key: CLAVE, ContentType: 'text/plain' }),
      { expiresIn: 300 },
    );
    ok('firma una URL de subida');
  } catch (cause) {
    error('no se pudo firmar la subida', cause instanceof Error ? cause.message : String(cause));
    process.exit(1);
  }

  // 2 — Subir de verdad. Falla si la política no concede s3:PutObject.
  const subida = await fetch(urlSubida, {
    method: 'PUT',
    headers: { 'Content-Type': 'text/plain' },
    body: CONTENIDO,
  });
  if (subida.ok) {
    ok('sube un archivo con esa URL  (s3:PutObject)');
  } else {
    error(
      `la subida devolvió ${String(subida.status)}`,
      subida.status === 403
        ? 'La política del usuario no permite s3:PutObject sobre este bucket, o el nombre del bucket no coincide.'
        : await subida.text().then((t) => t.slice(0, 200)),
    );
  }

  // 3 — Leer lo subido. Falla si falta s3:GetObject.
  const urlLectura = await getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: CLAVE }), {
    expiresIn: 300,
  });
  const lectura = await fetch(urlLectura);
  if (lectura.ok) {
    const texto = await lectura.text();
    if (texto === CONTENIDO) {
      ok('lee el archivo y el contenido coincide  (s3:GetObject)');
    } else {
      error('el contenido leído no coincide con el subido');
    }
  } else {
    error(
      `la lectura devolvió ${String(lectura.status)}`,
      'La política no permite s3:GetObject sobre este bucket.',
    );
  }

  // 4 — CORS. Es lo único que solo le importa al navegador, así que se simula
  // la petición previa que este hace antes de subir.
  const preflight = await fetch(`https://${BUCKET}.s3.${REGION}.amazonaws.com/${CLAVE}`, {
    method: 'OPTIONS',
    headers: {
      Origin: ORIGEN_FRONTEND,
      'Access-Control-Request-Method': 'PUT',
      'Access-Control-Request-Headers': 'content-type',
    },
  });
  const permitido = preflight.headers.get('access-control-allow-origin');
  if (preflight.ok && permitido) {
    ok(`el CORS del bucket acepta subidas desde ${permitido}`);
  } else {
    error(
      'el CORS del bucket NO aceptaría la subida desde el navegador',
      'Bucket → Permisos → CORS. Revisa que AllowedOrigins sea exactamente ' +
        `"${ORIGEN_FRONTEND}", sin barra al final, y que AllowedMethods incluya PUT.`,
    );
  }

  // 5 — Limpiar. Falla si no concede s3:DeleteObject.
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: CLAVE }));
    ok('borra el archivo de prueba  (s3:DeleteObject)');
  } catch (cause) {
    error(
      'no se pudo borrar el archivo de prueba',
      cause instanceof Error ? cause.message : String(cause),
    );
  }

  if (fallos === 0) {
    console.warn('\nTodo correcto. El almacenamiento está listo.\n');
  } else {
    console.error(`\n${String(fallos)} comprobación(es) fallaron. Revisa lo señalado arriba.\n`);
    process.exitCode = 1;
  }
}

void main();
