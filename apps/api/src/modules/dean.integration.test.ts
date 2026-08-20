import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseDatabaseUrl } from '../shared/database/connection';

vi.mock('../shared/storage/storage', () => ({
  objectKey: (enrollmentId: string, type: string) => `enrollments/${enrollmentId}/${type}`,
  signUpload: () => Promise.resolve('https://almacenamiento.example/subida'),
  signDownload: () => Promise.resolve('https://almacenamiento.example/lectura'),
  deleteObject: () => Promise.resolve(),
}));

const { createApp } = await import('../app');
const app = createApp();

const prisma = new PrismaClient({
  adapter: new PrismaPg(
    { connectionString: process.env.DATABASE_URL ?? '' },
    { schema: parseDatabaseUrl(process.env.DATABASE_URL ?? '').schema },
  ),
});

const PREFIJO_DOC = '77700';
const DOMINIO = '@decano.local';

/** Dos facultades: la del decano que prueba, y otra ajena. */
let facultadPropiaId = '';
let facultadAjenaId = '';
let programaPropioId = '';
let programaAjenoId = '';

let adminCookie = '';
let decanoCookie = '';
let decanoId = '';

function sufijo(): string {
  return Math.floor(Math.random() * 900000 + 100000).toString();
}

async function crearCuenta(role: 'APPLICANT' | 'ADMIN' | 'DEAN') {
  const s = sufijo();
  const email = `u${s}${DOMINIO}`;
  const password = 'contrasena-de-prueba';

  const user = await prisma.user.create({
    data: {
      documentType: 'CC',
      documentNumber: `${PREFIJO_DOC}${s}`,
      email,
      passwordHash: await import('bcrypt').then((b) => b.default.hash(password, 4)),
      role,
    },
  });

  const login = await request(app).post('/auth/login').send({ email, password });
  return { cookie: login.headers['set-cookie']?.[0] ?? '', id: user.id, email };
}

/** Inscripción enviada, tomada y con el pago verificado: lista para entregarse. */
async function lista(programaId: string): Promise<{ id: string; cookie: string }> {
  const aspirante = await crearCuenta('APPLICANT');
  const creada = await request(app).post('/enrollments').set('Cookie', aspirante.cookie);
  const id = creada.body.id as string;

  await request(app).patch(`/enrollments/${id}`).set('Cookie', aspirante.cookie).send({
    firstName: 'Ana',
    lastName: 'Perez',
    birthDate: '2004-03-15',
    sex: 'FEMALE',
    phone: '3001112233',
    city: 'Medellin',
    department: 'Antioquia',
    programId: programaId,
    shift: 'DAY',
    modality: 'ON_SITE',
  });

  for (const type of ['IDENTITY', 'ICFES', 'DIPLOMA']) {
    await request(app)
      .post(`/enrollments/${id}/documents/confirm`)
      .set('Cookie', aspirante.cookie)
      .send({ type, contentType: 'application/pdf', sizeBytes: 1024 });
  }

  await request(app).post(`/enrollments/${id}/submit`).set('Cookie', aspirante.cookie);
  await request(app).post(`/admin/enrollments/${id}/take`).set('Cookie', adminCookie);
  await request(app).post(`/admin/enrollments/${id}/payment/verify`).set('Cookie', adminCookie);

  return { id, cookie: aspirante.cookie };
}

async function entregada(): Promise<string> {
  const { id } = await lista(programaPropioId);
  await request(app).post(`/admin/enrollments/${id}/hand-over`).set('Cookie', adminCookie);
  return id;
}

/**
 * Entregada y con la cita ya pasada.
 *
 * Se agenda a futuro —el servicio no admite otra cosa— y se retrasa en la base
 * de datos, que es la única forma de llegar al momento de declarar el resultado
 * sin manipular el reloj del proceso.
 */
async function conCitaPasada(): Promise<string> {
  const id = await entregada();

  await request(app)
    .post(`/dean/enrollments/${id}/interview`)
    .set('Cookie', decanoCookie)
    .send({
      scheduledAt: new Date(Date.now() + 3_600_000).toISOString(),
      modality: 'ON_SITE',
      location: 'Oficina 201',
    });

  await prisma.interview.updateMany({
    where: { enrollmentId: id, outcome: null },
    data: { scheduledAt: new Date(Date.now() - 3_600_000) },
  });

  return id;
}

async function limpiar(): Promise<void> {
  const usuarios = await prisma.user.findMany({
    where: { documentNumber: { startsWith: PREFIJO_DOC } },
    select: { id: true },
  });
  const ids = usuarios.map((u) => u.id);
  if (ids.length === 0) return;

  await prisma.enrollment.deleteMany({ where: { userId: { in: ids } } });
  await prisma.faculty.updateMany({
    where: { deanUserId: { in: ids } },
    data: { deanUserId: null },
  });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
}

beforeAll(async () => {
  const ahora = new Date();
  const desde = new Date(ahora);
  desde.setMonth(desde.getMonth() - 1);
  const hasta = new Date(ahora);
  hasta.setMonth(hasta.getMonth() + 3);

  await prisma.academicPeriod.upsert({
    where: { code: 'DEC-1' },
    create: { code: 'DEC-1', opensAt: desde, closesAt: hasta, enrollmentFeeAmount: 85_000 },
    update: { opensAt: desde, closesAt: hasta, isActive: true },
  });

  facultadPropiaId = (
    await prisma.faculty.upsert({
      where: { code: 'FAC-PROPIA' },
      create: { code: 'FAC-PROPIA', name: 'Facultad propia' },
      update: {},
    })
  ).id;

  facultadAjenaId = (
    await prisma.faculty.upsert({
      where: { code: 'FAC-AJENA' },
      create: { code: 'FAC-AJENA', name: 'Facultad ajena' },
      update: {},
    })
  ).id;

  programaPropioId = (
    await prisma.academicProgram.upsert({
      where: { code: 'DEC-PRO' },
      create: { code: 'DEC-PRO', name: 'Programa propio', facultyId: facultadPropiaId },
      update: { facultyId: facultadPropiaId },
    })
  ).id;

  programaAjenoId = (
    await prisma.academicProgram.upsert({
      where: { code: 'DEC-AJE' },
      create: { code: 'DEC-AJE', name: 'Programa ajeno', facultyId: facultadAjenaId },
      update: { facultyId: facultadAjenaId },
    })
  ).id;
});

beforeEach(async () => {
  await limpiar();

  adminCookie = (await crearCuenta('ADMIN')).cookie;

  const decano = await crearCuenta('DEAN');
  decanoCookie = decano.cookie;
  decanoId = decano.id;

  await prisma.faculty.update({
    where: { id: facultadPropiaId },
    data: { deanUserId: decanoId },
  });
});

afterAll(async () => {
  await limpiar();
  await prisma.$disconnect();
});

describe('entrega a la facultad', () => {
  it('entrega cuando documentos y pago están conformes', async () => {
    const { id } = await lista(programaPropioId);

    const res = await request(app)
      .post(`/admin/enrollments/${id}/hand-over`)
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('PENDING_INTERVIEW');
  });

  it('no entrega con el pago pendiente', async () => {
    const aspirante = await crearCuenta('APPLICANT');
    const creada = await request(app).post('/enrollments').set('Cookie', aspirante.cookie);
    const id = creada.body.id as string;

    await request(app).patch(`/enrollments/${id}`).set('Cookie', aspirante.cookie).send({
      firstName: 'Ana',
      lastName: 'Perez',
      birthDate: '2004-03-15',
      sex: 'FEMALE',
      phone: '3001112233',
      city: 'Medellin',
      department: 'Antioquia',
      programId: programaPropioId,
      shift: 'DAY',
      modality: 'ON_SITE',
    });
    for (const type of ['IDENTITY', 'ICFES', 'DIPLOMA']) {
      await request(app)
        .post(`/enrollments/${id}/documents/confirm`)
        .set('Cookie', aspirante.cookie)
        .send({ type, contentType: 'application/pdf', sizeBytes: 1024 });
    }
    await request(app).post(`/enrollments/${id}/submit`).set('Cookie', aspirante.cookie);
    await request(app).post(`/admin/enrollments/${id}/take`).set('Cookie', adminCookie);

    const res = await request(app)
      .post(`/admin/enrollments/${id}/hand-over`)
      .set('Cookie', adminCookie);

    expect(res.status).toBe(409);
    expect(res.body.error.message).toMatch(/pago/i);
  });

  it('no entrega si la facultad no tiene decano', async () => {
    const { id } = await lista(programaAjenoId);

    const res = await request(app)
      .post(`/admin/enrollments/${id}/hand-over`)
      .set('Cookie', adminCookie);

    expect(res.status).toBe(409);
    expect(res.body.error.message).toMatch(/decano/i);
  });

  it('el decano no puede entregarse una inscripción a sí mismo', async () => {
    const { id } = await lista(programaPropioId);

    const res = await request(app)
      .post(`/admin/enrollments/${id}/hand-over`)
      .set('Cookie', decanoCookie);

    expect(res.status).toBe(403);
  });
});

describe('alcance del decano', () => {
  // La garantía central: que exista una inscripción de otra facultad no debe
  // poder deducirse comparando respuestas.
  it('una inscripción de otra facultad responde igual que una inexistente', async () => {
    const { id } = await lista(programaAjenoId);

    const ajena = await request(app).get(`/dean/enrollments/${id}`).set('Cookie', decanoCookie);
    const inexistente = await request(app)
      .get('/dean/enrollments/cmnoexisteningunaaqui000')
      .set('Cookie', decanoCookie);

    expect(ajena.status).toBe(inexistente.status);
    expect(ajena.body).toEqual(inexistente.body);
  });

  it('la bandeja solo trae lo de su facultad y ya entregado', async () => {
    const entregadaId = await entregada();
    const sinEntregar = await lista(programaPropioId);
    const ajena = await lista(programaAjenoId);

    const res = await request(app).get('/dean/enrollments').set('Cookie', decanoCookie);

    expect(res.status).toBe(200);
    const ids = (res.body.items as { id: string }[]).map((i) => i.id);
    expect(ids).toContain(entregadaId);
    expect(ids).not.toContain(sinEntregar.id);
    expect(ids).not.toContain(ajena.id);
  });

  it('indicar otra facultad en la petición no amplía el alcance', async () => {
    const { id } = await lista(programaAjenoId);

    const res = await request(app)
      .get(`/dean/enrollments?facultyId=${facultadAjenaId}`)
      .set('Cookie', decanoCookie);

    const ids = (res.body.items as { id: string }[]).map((i) => i.id);
    expect(ids).not.toContain(id);
  });
});

describe('entrevista', () => {
  it('agenda y el aspirante la ve en su proceso', async () => {
    const { id, cookie } = await lista(programaPropioId);
    await request(app).post(`/admin/enrollments/${id}/hand-over`).set('Cookie', adminCookie);

    const res = await request(app)
      .post(`/dean/enrollments/${id}/interview`)
      .set('Cookie', decanoCookie)
      .send({
        scheduledAt: new Date(Date.now() + 86_400_000).toISOString(),
        modality: 'ON_SITE',
        location: 'Oficina 201',
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('INTERVIEW_SCHEDULED');

    const propio = await request(app).get(`/enrollments/${id}`).set('Cookie', cookie);
    expect(propio.body.interview.location).toBe('Oficina 201');
  });

  it('rechaza una fecha que ya pasó', async () => {
    const id = await entregada();

    const res = await request(app)
      .post(`/dean/enrollments/${id}/interview`)
      .set('Cookie', decanoCookie)
      .send({
        scheduledAt: new Date(Date.now() - 86_400_000).toISOString(),
        modality: 'ON_SITE',
        location: 'Oficina 201',
      });

    expect(res.status).toBe(400);
  });

  it('no agenda antes de que el administrador entregue', async () => {
    const { id } = await lista(programaPropioId);

    const res = await request(app)
      .post(`/dean/enrollments/${id}/interview`)
      .set('Cookie', decanoCookie)
      .send({
        scheduledAt: new Date(Date.now() + 86_400_000).toISOString(),
        modality: 'ON_SITE',
        location: 'Oficina 201',
      });

    expect(res.status).toBe(409);
  });

  it('exige el enlace si la entrevista es virtual', async () => {
    const id = await entregada();

    const res = await request(app)
      .post(`/dean/enrollments/${id}/interview`)
      .set('Cookie', decanoCookie)
      .send({ scheduledAt: new Date(Date.now() + 86_400_000).toISOString(), modality: 'VIRTUAL' });

    expect(res.status).toBe(400);
  });

  it('una inasistencia devuelve a la espera y deja constancia', async () => {
    const id = await conCitaPasada();

    const res = await request(app)
      .post(`/dean/enrollments/${id}/interview/outcome`)
      .set('Cookie', decanoCookie)
      .send({ outcome: 'NO_SHOW' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('PENDING_INTERVIEW');
    expect(res.body.interview).toBeNull();
    expect(res.body.pastInterviews).toHaveLength(1);
    expect(res.body.pastInterviews[0].outcome).toBe('NO_SHOW');
  });

  it('tras una inasistencia se puede citar de nuevo, y la anterior sigue constando', async () => {
    const id = await conCitaPasada();
    await request(app)
      .post(`/dean/enrollments/${id}/interview/outcome`)
      .set('Cookie', decanoCookie)
      .send({ outcome: 'NO_SHOW' });

    const res = await request(app)
      .post(`/dean/enrollments/${id}/interview`)
      .set('Cookie', decanoCookie)
      .send({
        scheduledAt: new Date(Date.now() + 86_400_000).toISOString(),
        modality: 'VIRTUAL',
        meetingUrl: 'https://reunion.example.com/abc',
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('INTERVIEW_SCHEDULED');
    expect(res.body.pastInterviews).toHaveLength(1);
  });

  it('no deja declarar realizada una cita que aún no ocurre', async () => {
    const id = await entregada();
    await request(app)
      .post(`/dean/enrollments/${id}/interview`)
      .set('Cookie', decanoCookie)
      .send({
        scheduledAt: new Date(Date.now() + 86_400_000).toISOString(),
        modality: 'ON_SITE',
        location: 'Oficina 201',
      });

    const res = await request(app)
      .post(`/dean/enrollments/${id}/interview/outcome`)
      .set('Cookie', decanoCookie)
      .send({ outcome: 'HELD' });

    expect(res.status).toBe(409);
  });
});

describe('decisión del decano', () => {
  async function conEntrevistaRealizada(): Promise<string> {
    const id = await conCitaPasada();
    await request(app)
      .post(`/dean/enrollments/${id}/interview/outcome`)
      .set('Cookie', decanoCookie)
      .send({ outcome: 'HELD' });
    return id;
  }

  it('aprueba tras la entrevista y promueve al aspirante a estudiante', async () => {
    const id = await conEntrevistaRealizada();

    const res = await request(app)
      .post(`/dean/enrollments/${id}/approve`)
      .set('Cookie', decanoCookie);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('APPROVED');

    // Se comprueba en la base de datos, no solo en la respuesta: aprobación y
    // promoción tienen que haber quedado juntas, y a nombre del decano.
    const fila = await prisma.enrollment.findUnique({
      where: { id },
      select: { decidedByUserId: true, user: { select: { role: true } } },
    });
    expect(fila?.user.role).toBe('STUDENT');
    expect(fila?.decidedByUserId).toBe(decanoId);
  });

  it('no aprueba sin la entrevista realizada', async () => {
    const id = await conCitaPasada();

    const res = await request(app)
      .post(`/dean/enrollments/${id}/approve`)
      .set('Cookie', decanoCookie);

    expect(res.status).toBe(409);
  });

  it('el administrador ya no puede aprobar, y nada cambia al intentarlo', async () => {
    const id = await conEntrevistaRealizada();

    const res = await request(app)
      .post(`/dean/enrollments/${id}/approve`)
      .set('Cookie', adminCookie);

    expect(res.status).toBe(403);

    const fila = await prisma.enrollment.findUnique({
      where: { id },
      select: { status: true, user: { select: { role: true } } },
    });
    expect(fila?.status).toBe('INTERVIEW_HELD');
    expect(fila?.user.role).toBe('APPLICANT');
  });

  it('rechaza con motivo y el aspirante lo lee', async () => {
    const id = await conEntrevistaRealizada();

    const res = await request(app)
      .post(`/dean/enrollments/${id}/reject`)
      .set('Cookie', decanoCookie)
      .send({ reason: 'El perfil no corresponde al programa solicitado.' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('REJECTED');
    expect(res.body.rejectionReason).toMatch(/no corresponde/);
  });

  it('no rechaza sin motivo', async () => {
    const id = await conCitaPasada();

    const res = await request(app)
      .post(`/dean/enrollments/${id}/reject`)
      .set('Cookie', decanoCookie)
      .send({ reason: '   ' });

    expect(res.status).toBe(400);
  });
});

describe('el decano no hereda las atribuciones del administrador', () => {
  it('no gestiona cuentas', async () => {
    const res = await request(app).get('/admin/users').set('Cookie', decanoCookie);
    expect(res.status).toBe(403);
  });

  it('no administra periodos', async () => {
    const res = await request(app).get('/admin/periods').set('Cookie', decanoCookie);
    expect(res.status).toBe(403);
  });

  it('no verifica pagos', async () => {
    const { id } = await lista(programaPropioId);

    const res = await request(app)
      .post(`/admin/enrollments/${id}/payment/verify`)
      .set('Cookie', decanoCookie);

    expect(res.status).toBe(403);
  });
});
