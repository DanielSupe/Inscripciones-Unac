import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { parseDatabaseUrl } from '../../shared/database/connection';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// El almacenamiento se sustituye por un doble: las pruebas no deben subir nada
// a la nube ni exigir credenciales para correr.
vi.mock('../../shared/storage/storage', () => ({
  objectKey: (enrollmentId: string, type: string) => `enrollments/${enrollmentId}/${type}`,
  signUpload: () => Promise.resolve('https://almacenamiento.example/permiso-de-subida'),
  signDownload: () => Promise.resolve('https://almacenamiento.example/permiso-de-lectura'),
  deleteObject: () => Promise.resolve(),
}));

const { createApp } = await import('../../app');
const app = createApp();

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' }, { schema: parseDatabaseUrl(process.env.DATABASE_URL ?? '').schema }),
});

const PREFIJO_DOC = '77700';
const DOMINIO = '@prueba.local';
let programId = '';
let periodId = '';

/** Crea un aspirante y devuelve su cookie de sesión. */
async function nuevoAspirante(): Promise<string> {
  const sufijo = Math.floor(Math.random() * 90000 + 10000).toString();
  const datos = {
    documentType: 'CC',
    documentNumber: `${PREFIJO_DOC}${sufijo}`,
    email: `asp${sufijo}${DOMINIO}`,
    emailConfirmation: `asp${sufijo}${DOMINIO}`,
    password: 'contrasena-de-prueba',
    acceptedPolicies: true,
  };
  await request(app).post('/auth/register').send(datos);
  const login = await request(app)
    .post('/auth/login')
    .send({ email: datos.email, password: datos.password });
  return login.headers['set-cookie']?.[0] ?? '';
}

/** Deja una inscripción lista para enviar, salvo lo que se indique omitir. */
async function inscripcionCompleta(cookie: string, omitir: 'nada' | 'documentos' = 'nada') {
  const creada = await request(app).post('/enrollments').set('Cookie', cookie);
  const id = creada.body.id as string;

  await request(app).patch(`/enrollments/${id}`).set('Cookie', cookie).send({
    firstName: 'Ana',
    lastName: 'Pérez',
    birthDate: '2004-03-15',
    sex: 'FEMALE',
    phone: '3001112233',
    city: 'Medellín',
    department: 'Antioquia',
    previousSchool: 'Colegio de prueba',
    graduationYear: 2021,
    icfesRegistration: 'AC202100001',
    icfesScore: 350,
    programId,
    shift: 'DAY',
    modality: 'ON_SITE',
  });

  if (omitir !== 'documentos') {
    for (const type of ['IDENTITY', 'ICFES']) {
      await request(app)
        .post(`/enrollments/${id}/documents/confirm`)
        .set('Cookie', cookie)
        .send({ type, contentType: 'application/pdf', sizeBytes: 1024 });
    }
  }

  return id;
}

beforeAll(async () => {
  const ahora = new Date();
  const desde = new Date(ahora);
  desde.setMonth(desde.getMonth() - 1);
  const hasta = new Date(ahora);
  hasta.setMonth(hasta.getMonth() + 3);

  const program = await prisma.academicProgram.upsert({
    where: { code: 'PRU' },
    create: { code: 'PRU', name: 'Programa de prueba' },
    update: {},
  });
  programId = program.id;

  const period = await prisma.academicPeriod.upsert({
    where: { code: 'PRUEBA-1' },
    create: {
      code: 'PRUEBA-1',
      opensAt: desde,
      closesAt: hasta,
      enrollmentFeeAmount: 85_000,
    },
    update: { opensAt: desde, closesAt: hasta },
  });
  periodId = period.id;
});

/**
 * Limpia en orden inverso a las dependencias.
 *
 * Un usuario con inscripciones no se puede borrar: la clave foránea lo impide,
 * y está bien que así sea —en producción los usuarios se borran de forma
 * lógica, nunca física—. Las inscripciones sí arrastran sus adjuntos y su
 * recibo en cascada.
 */
async function limpiar(): Promise<void> {
  const usuarios = await prisma.user.findMany({
    where: { documentNumber: { startsWith: PREFIJO_DOC } },
    select: { id: true },
  });
  const ids = usuarios.map((u) => u.id);
  if (ids.length === 0) return;

  await prisma.enrollment.deleteMany({ where: { userId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
}

beforeEach(limpiar);

afterAll(async () => {
  await limpiar();
  await prisma.$disconnect();
});

describe('inscripción', () => {
  it('empieza en borrador con los cuatro pasos pendientes', async () => {
    const cookie = await nuevoAspirante();

    const response = await request(app).post('/enrollments').set('Cookie', cookie);

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('DRAFT');
    expect(response.body.pendingSteps).toEqual([
      'personal',
      'academic',
      'aspiration',
      'documents',
    ]);
  });

  it('devuelve la que ya existe en vez de crear una segunda para el mismo periodo', async () => {
    const cookie = await nuevoAspirante();

    const primera = await request(app).post('/enrollments').set('Cookie', cookie);
    const segunda = await request(app).post('/enrollments').set('Cookie', cookie);

    expect(segunda.body.id).toBe(primera.body.id);
    const total = await prisma.enrollment.count({ where: { id: primera.body.id as string } });
    expect(total).toBe(1);
  });

  it('ignora el estado enviado en el cuerpo y guarda el resto', async () => {
    const cookie = await nuevoAspirante();
    const creada = await request(app).post('/enrollments').set('Cookie', cookie);

    const response = await request(app)
      .patch(`/enrollments/${creada.body.id as string}`)
      .set('Cookie', cookie)
      .send({ status: 'APPROVED', city: 'Cali' });

    expect(response.body.status).toBe('DRAFT');
    expect(response.body.data.city).toBe('Cali');
  });

  it('rechaza un dato con formato inválido sin guardarlo', async () => {
    const cookie = await nuevoAspirante();
    const creada = await request(app).post('/enrollments').set('Cookie', cookie);

    const response = await request(app)
      .patch(`/enrollments/${creada.body.id as string}`)
      .set('Cookie', cookie)
      .send({ graduationYear: 2099 });

    expect(response.status).toBe(400);
    expect(response.body.error.details).toHaveProperty('graduationYear');
  });

  it('no deja enviar si faltan documentos, y dice cuáles', async () => {
    const cookie = await nuevoAspirante();
    const id = await inscripcionCompleta(cookie, 'documentos');

    const response = await request(app).post(`/enrollments/${id}/submit`).set('Cookie', cookie);

    expect(response.status).toBe(400);
    expect(response.body.error.details.pasosPendientes).toContain('documents');
  });

  it('envía y emite el recibo con el valor del periodo', async () => {
    const cookie = await nuevoAspirante();
    const id = await inscripcionCompleta(cookie);

    const response = await request(app).post(`/enrollments/${id}/submit`).set('Cookie', cookie);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('SUBMITTED');
    expect(response.body.receipt.amount).toBe(85_000);
    expect(response.body.receipt.status).toBe('PENDING');
  });

  it('no emite un segundo recibo al intentar enviar de nuevo', async () => {
    const cookie = await nuevoAspirante();
    const id = await inscripcionCompleta(cookie);
    await request(app).post(`/enrollments/${id}/submit`).set('Cookie', cookie);

    const segundo = await request(app).post(`/enrollments/${id}/submit`).set('Cookie', cookie);

    expect(segundo.status).toBe(409);
    expect(await prisma.paymentReceipt.count({ where: { enrollmentId: id } })).toBe(1);
  });

  it('no deja editar una inscripción ya enviada', async () => {
    const cookie = await nuevoAspirante();
    const id = await inscripcionCompleta(cookie);
    await request(app).post(`/enrollments/${id}/submit`).set('Cookie', cookie);

    const response = await request(app)
      .patch(`/enrollments/${id}`)
      .set('Cookie', cookie)
      .send({ city: 'Cali' });

    expect(response.status).toBe(409);
  });

  it('permite corregir y reenviar tras un rechazo, conservando el recibo', async () => {
    const cookie = await nuevoAspirante();
    const id = await inscripcionCompleta(cookie);
    await request(app).post(`/enrollments/${id}/submit`).set('Cookie', cookie);

    // El rechazo lo hará la consola de administración; aquí se provoca el
    // estado directamente porque esa pantalla es del change siguiente.
    await prisma.enrollment.update({
      where: { id },
      data: { status: 'REJECTED', rejectionReason: 'La foto del documento es ilegible.' },
    });

    const reabierta = await request(app).post(`/enrollments/${id}/reopen`).set('Cookie', cookie);
    expect(reabierta.status).toBe(200);
    expect(reabierta.body.status).toBe('DRAFT');

    const reenviada = await request(app).post(`/enrollments/${id}/submit`).set('Cookie', cookie);
    expect(reenviada.body.status).toBe('SUBMITTED');
    // El motivo anterior deja de mostrarse como vigente.
    expect(reenviada.body.rejectionReason).toBeNull();
    expect(await prisma.paymentReceipt.count({ where: { enrollmentId: id } })).toBe(1);
  });

  it('permite una inscripción en otro periodo', async () => {
    const cookie = await nuevoAspirante();
    await request(app).post('/enrollments').set('Cookie', cookie);

    const user = await prisma.user.findFirst({
      where: { documentNumber: { startsWith: PREFIJO_DOC } },
      orderBy: { createdAt: 'desc' },
    });
    const otroPeriodo = await prisma.academicPeriod.upsert({
      where: { code: 'PRUEBA-2' },
      create: {
        code: 'PRUEBA-2',
        opensAt: new Date('2030-01-01'),
        closesAt: new Date('2030-06-01'),
        enrollmentFeeAmount: 90_000,
      },
      update: {},
    });

    // La unicidad es por aspirante y periodo, así que esto no choca.
    const segunda = await prisma.enrollment.create({
      data: { userId: user?.id ?? '', periodId: otroPeriodo.id },
    });

    expect(segunda.id).toBeTruthy();
    expect(await prisma.enrollment.count({ where: { userId: user?.id ?? '' } })).toBe(2);
  });
});

describe('pertenencia', () => {
  it('la inscripción ajena responde igual que una inexistente', async () => {
    const dueño = await nuevoAspirante();
    const id = await inscripcionCompleta(dueño);
    const intruso = await nuevoAspirante();

    const ajena = await request(app).get(`/enrollments/${id}`).set('Cookie', intruso);
    const inexistente = await request(app).get('/enrollments/noexiste').set('Cookie', intruso);

    // El punto de la prueba: comparar las dos respuestas, no cada mensaje por
    // separado. Si difirieran, se podría averiguar qué identificadores existen.
    expect(ajena.status).toBe(inexistente.status);
    expect(ajena.body).toEqual(inexistente.body);
  });

  it('no deja modificar la inscripción de otro', async () => {
    const dueño = await nuevoAspirante();
    const id = await inscripcionCompleta(dueño);
    const intruso = await nuevoAspirante();

    const response = await request(app)
      .patch(`/enrollments/${id}`)
      .set('Cookie', intruso)
      .send({ city: 'Intrusa' });

    expect(response.status).toBe(404);
    const enrollment = await prisma.enrollment.findUnique({ where: { id } });
    expect(enrollment?.city).toBe('Medellín');
  });

  it('no deja ver el recibo ni los documentos de otro', async () => {
    const dueño = await nuevoAspirante();
    const id = await inscripcionCompleta(dueño);
    await request(app).post(`/enrollments/${id}/submit`).set('Cookie', dueño);
    const intruso = await nuevoAspirante();

    const recibo = await request(app).get(`/enrollments/${id}/receipt`).set('Cookie', intruso);
    const documento = await request(app)
      .get(`/enrollments/${id}/documents/IDENTITY/url`)
      .set('Cookie', intruso);

    expect(recibo.status).toBe(404);
    expect(documento.status).toBe(404);
  });

  it('sin sesión no se llega a ninguna inscripción', async () => {
    const dueño = await nuevoAspirante();
    const id = await inscripcionCompleta(dueño);

    const response = await request(app).get(`/enrollments/${id}`);

    expect(response.status).toBe(401);
  });
});

describe('documentos', () => {
  it('rechaza un tipo de archivo no admitido antes de firmar', async () => {
    const cookie = await nuevoAspirante();
    const creada = await request(app).post('/enrollments').set('Cookie', cookie);

    const response = await request(app)
      .post(`/enrollments/${creada.body.id as string}/documents/upload-ticket`)
      .set('Cookie', cookie)
      .send({ type: 'IDENTITY', contentType: 'application/zip', sizeBytes: 1024 });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toContain('PDF');
  });

  it('rechaza un archivo demasiado grande antes de firmar', async () => {
    const cookie = await nuevoAspirante();
    const creada = await request(app).post('/enrollments').set('Cookie', cookie);

    const response = await request(app)
      .post(`/enrollments/${creada.body.id as string}/documents/upload-ticket`)
      .set('Cookie', cookie)
      .send({ type: 'IDENTITY', contentType: 'application/pdf', sizeBytes: 99_999_999 });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toContain('MB');
  });

  it('sustituye el documento en vez de acumular', async () => {
    const cookie = await nuevoAspirante();
    const creada = await request(app).post('/enrollments').set('Cookie', cookie);
    const id = creada.body.id as string;

    for (const sizeBytes of [1024, 2048]) {
      await request(app)
        .post(`/enrollments/${id}/documents/confirm`)
        .set('Cookie', cookie)
        .send({ type: 'IDENTITY', contentType: 'application/pdf', sizeBytes });
    }

    const adjuntos = await prisma.enrollmentAttachment.findMany({ where: { enrollmentId: id } });
    expect(adjuntos).toHaveLength(1);
    expect(adjuntos[0]?.sizeBytes).toBe(2048);
  });

  it('no deja cambiar documentos con la inscripción enviada', async () => {
    const cookie = await nuevoAspirante();
    const id = await inscripcionCompleta(cookie);
    await request(app).post(`/enrollments/${id}/submit`).set('Cookie', cookie);

    const response = await request(app)
      .post(`/enrollments/${id}/documents/upload-ticket`)
      .set('Cookie', cookie)
      .send({ type: 'IDENTITY', contentType: 'application/pdf', sizeBytes: 1024 });

    expect(response.status).toBe(409);
  });
});

describe('recibo', () => {
  it('no existe antes de enviar', async () => {
    const cookie = await nuevoAspirante();
    const id = await inscripcionCompleta(cookie);

    const response = await request(app).get(`/enrollments/${id}/receipt`).set('Cookie', cookie);

    expect(response.status).toBe(409);
    expect(response.body.error.message).toContain('envíes');
  });

  it('conserva su valor aunque cambie la tarifa del periodo', async () => {
    const cookie = await nuevoAspirante();
    const id = await inscripcionCompleta(cookie);
    await request(app).post(`/enrollments/${id}/submit`).set('Cookie', cookie);

    await prisma.academicPeriod.update({
      where: { id: periodId },
      data: { enrollmentFeeAmount: 120_000 },
    });

    const response = await request(app).get(`/enrollments/${id}/receipt`).set('Cookie', cookie);
    expect(response.body.amount).toBe(85_000);

    await prisma.academicPeriod.update({
      where: { id: periodId },
      data: { enrollmentFeeAmount: 85_000 },
    });
  });

  it('se descarga como PDF', async () => {
    const cookie = await nuevoAspirante();
    const id = await inscripcionCompleta(cookie);
    await request(app).post(`/enrollments/${id}/submit`).set('Cookie', cookie);

    const response = await request(app)
      .get(`/enrollments/${id}/receipt.pdf`)
      .set('Cookie', cookie)
      .buffer(true)
      .parse((res, callback) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          callback(null, Buffer.concat(chunks));
        });
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('application/pdf');
    expect((response.body as Buffer).subarray(0, 4).toString()).toBe('%PDF');
  });
});
