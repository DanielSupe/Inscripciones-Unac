import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseDatabaseUrl } from '../shared/database/connection';

// El almacenamiento se sustituye por un doble: las pruebas no suben nada a la
// nube ni exigen credenciales para correr.
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

const PREFIJO_DOC = '55500';
const DOMINIO = '@prueba.local';
let programId = '';
let periodId = '';
let adminCookie = '';
let adminId = '';

function sufijo(): string {
  return Math.floor(Math.random() * 900000 + 100000).toString();
}

async function crearCuenta(role: 'APPLICANT' | 'ADMIN'): Promise<{ cookie: string; id: string; email: string }> {
  const s = sufijo();
  const email = `u${s}${DOMINIO}`;
  const password = 'contrasena-de-prueba';

  const user = await prisma.user.create({
    data: {
      documentType: 'CC',
      documentNumber: `${PREFIJO_DOC}${s}`,
      email,
      // bcrypt de 'contrasena-de-prueba' con coste 4, para no cifrar en cada prueba.
      passwordHash: await import('bcrypt').then((b) => b.default.hash(password, 4)),
      role,
    },
  });

  const login = await request(app).post('/auth/login').send({ email, password });
  return { cookie: login.headers['set-cookie']?.[0] ?? '', id: user.id, email };
}

/** Inscripción lista para enviar, con sus dos documentos. */
async function inscripcionEnviada(cookie: string): Promise<string> {
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
    programId,
    shift: 'DAY',
    modality: 'ON_SITE',
  });

  for (const type of ['IDENTITY', 'ICFES', 'DIPLOMA']) {
    await request(app)
      .post(`/enrollments/${id}/documents/confirm`)
      .set('Cookie', cookie)
      .send({ type, contentType: 'application/pdf', sizeBytes: 1024 });
  }

  await request(app).post(`/enrollments/${id}/submit`).set('Cookie', cookie);
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
  await prisma.user.updateMany({
    where: { reviewedEnrollments: { some: {} } },
    data: {},
  });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
}

beforeAll(async () => {
  const ahora = new Date();
  const desde = new Date(ahora);
  desde.setMonth(desde.getMonth() - 1);
  const hasta = new Date(ahora);
  hasta.setMonth(hasta.getMonth() + 3);

  programId = (
    await prisma.academicProgram.upsert({
      where: { code: 'ADM-PRU' },
      create: { code: 'ADM-PRU', name: 'Programa de prueba admin' },
      update: {},
    })
  ).id;

  periodId = (
    await prisma.academicPeriod.upsert({
      where: { code: 'ADMIN-1' },
      create: { code: 'ADMIN-1', opensAt: desde, closesAt: hasta, enrollmentFeeAmount: 85_000 },
      update: { opensAt: desde, closesAt: hasta, enrollmentFeeAmount: 85_000, isActive: true },
    })
  ).id;

  // Los demás periodos se desactivan para que el abierto sea este.
  await prisma.academicPeriod.updateMany({
    where: { code: { not: 'ADMIN-1' } },
    data: { isActive: false },
  });
});

beforeEach(async () => {
  await limpiar();
  const admin = await crearCuenta('ADMIN');
  adminCookie = admin.cookie;
  adminId = admin.id;
});

afterAll(async () => {
  await limpiar();
  await prisma.academicPeriod.updateMany({ data: { isActive: true } });
  await prisma.$disconnect();
});

describe('acceso a la consola', () => {
  it('un aspirante recibe 403 en todas las rutas de administración', async () => {
    const aspirante = await crearCuenta('APPLICANT');

    for (const ruta of ['/admin/users', '/admin/enrollments', '/admin/periods']) {
      const response = await request(app).get(ruta).set('Cookie', aspirante.cookie);
      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    }
  });

  it('sin sesión responde 401', async () => {
    const response = await request(app).get('/admin/users');
    expect(response.status).toBe(401);
  });
});

describe('un administrador alcanza cualquier inscripción', () => {
  it('ve el detalle de la inscripción de otro', async () => {
    // Es la primera vez que la excepción de pertenencia se ejercita en positivo:
    // hasta ahora solo se había probado que un aspirante NO alcanza lo ajeno.
    const aspirante = await crearCuenta('APPLICANT');
    const id = await inscripcionEnviada(aspirante.cookie);

    const response = await request(app).get(`/admin/enrollments/${id}`).set('Cookie', adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.data.firstName).toBe('Ana');
  });

  it('la bandeja deja fuera las inscripciones sin enviar', async () => {
    const aspirante = await crearCuenta('APPLICANT');
    await request(app).post('/enrollments').set('Cookie', aspirante.cookie);

    const response = await request(app).get('/admin/enrollments').set('Cookie', adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.items.every((i: { status: string }) => i.status !== 'DRAFT')).toBe(true);
  });
});

describe('decisión sobre una inscripción', () => {
  it('no aprueba sin el pago verificado, y no deja nada a medias', async () => {
    const aspirante = await crearCuenta('APPLICANT');
    const id = await inscripcionEnviada(aspirante.cookie);

    const response = await request(app)
      .post(`/admin/enrollments/${id}/approve`)
      .set('Cookie', adminCookie);

    expect(response.status).toBe(409);

    // Ni el estado ni el rol se movieron.
    const enrollment = await prisma.enrollment.findUnique({ where: { id } });
    const user = await prisma.user.findUnique({ where: { id: aspirante.id } });
    expect(enrollment?.status).toBe('SUBMITTED');
    expect(user?.role).toBe('APPLICANT');
  });

  it('aprueba y promueve en la misma operación', async () => {
    const aspirante = await crearCuenta('APPLICANT');
    const id = await inscripcionEnviada(aspirante.cookie);
    await request(app).post(`/admin/enrollments/${id}/payment/verify`).set('Cookie', adminCookie);

    const response = await request(app)
      .post(`/admin/enrollments/${id}/approve`)
      .set('Cookie', adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('APPROVED');

    const user = await prisma.user.findUnique({ where: { id: aspirante.id } });
    expect(user?.role).toBe('STUDENT');
  });

  it('el aspirante aprobado entra como estudiante', async () => {
    const aspirante = await crearCuenta('APPLICANT');
    const id = await inscripcionEnviada(aspirante.cookie);
    await request(app).post(`/admin/enrollments/${id}/payment/verify`).set('Cookie', adminCookie);
    await request(app).post(`/admin/enrollments/${id}/approve`).set('Cookie', adminCookie);

    const me = await request(app).get('/auth/me').set('Cookie', aspirante.cookie);

    expect(me.body.role).toBe('STUDENT');
  });

  it('no rechaza sin motivo', async () => {
    const aspirante = await crearCuenta('APPLICANT');
    const id = await inscripcionEnviada(aspirante.cookie);

    const response = await request(app)
      .post(`/admin/enrollments/${id}/reject`)
      .set('Cookie', adminCookie)
      .send({ reason: '   ' });

    expect(response.status).toBe(400);
    const enrollment = await prisma.enrollment.findUnique({ where: { id } });
    expect(enrollment?.status).toBe('SUBMITTED');
  });

  it('rechaza con motivo y el aspirante lo ve', async () => {
    const aspirante = await crearCuenta('APPLICANT');
    const id = await inscripcionEnviada(aspirante.cookie);
    const motivo = 'La foto del documento de identidad es ilegible.';

    await request(app)
      .post(`/admin/enrollments/${id}/reject`)
      .set('Cookie', adminCookie)
      .send({ reason: motivo });

    const proceso = await request(app).get('/enrollments/current').set('Cookie', aspirante.cookie);
    expect(proceso.body.status).toBe('REJECTED');
    expect(proceso.body.rejectionReason).toBe(motivo);
  });

  it('recorre el ciclo completo: tomar, rechazar, corregir, verificar y aprobar', async () => {
    const aspirante = await crearCuenta('APPLICANT');
    const id = await inscripcionEnviada(aspirante.cookie);

    const tomada = await request(app)
      .post(`/admin/enrollments/${id}/take`)
      .set('Cookie', adminCookie);
    expect(tomada.body.status).toBe('UNDER_REVIEW');

    await request(app)
      .post(`/admin/enrollments/${id}/reject`)
      .set('Cookie', adminCookie)
      .send({ reason: 'Falta legibilidad en el documento.' });

    await request(app).post(`/enrollments/${id}/reopen`).set('Cookie', aspirante.cookie);
    const reenviada = await request(app)
      .post(`/enrollments/${id}/submit`)
      .set('Cookie', aspirante.cookie);
    expect(reenviada.body.status).toBe('SUBMITTED');
    // El motivo anterior deja de mostrarse como vigente.
    expect(reenviada.body.rejectionReason).toBeNull();

    await request(app).post(`/admin/enrollments/${id}/payment/verify`).set('Cookie', adminCookie);
    const aprobada = await request(app)
      .post(`/admin/enrollments/${id}/approve`)
      .set('Cookie', adminCookie);

    expect(aprobada.body.status).toBe('APPROVED');
    // Un solo recibo en todo el ciclo, con su número original.
    const recibos = await prisma.paymentReceipt.count({ where: { enrollmentId: id } });
    expect(recibos).toBe(1);
  });

  it('deshacer la verificación vuelve a impedir la aprobación', async () => {
    const aspirante = await crearCuenta('APPLICANT');
    const id = await inscripcionEnviada(aspirante.cookie);
    await request(app).post(`/admin/enrollments/${id}/payment/verify`).set('Cookie', adminCookie);
    await request(app).post(`/admin/enrollments/${id}/payment/unverify`).set('Cookie', adminCookie);

    const response = await request(app)
      .post(`/admin/enrollments/${id}/approve`)
      .set('Cookie', adminCookie);

    expect(response.status).toBe(409);
  });
});

describe('gestión de cuentas', () => {
  it('lista paginando y buscando de forma parcial e insensible a mayúsculas', async () => {
    const cuenta = await crearCuenta('APPLICANT');

    const response = await request(app)
      .get(`/admin/users?search=${cuenta.email.slice(2, 8).toUpperCase()}`)
      .set('Cookie', adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.pageSize).toBeGreaterThan(0);
    expect(response.body.items.some((u: { email: string }) => u.email === cuenta.email)).toBe(true);
  });

  it('no muestra las cuentas eliminadas', async () => {
    const cuenta = await crearCuenta('APPLICANT');
    await request(app).delete(`/admin/users/${cuenta.id}`).set('Cookie', adminCookie);

    const response = await request(app)
      .get(`/admin/users?search=${cuenta.email}`)
      .set('Cookie', adminCookie);

    expect(response.body.items).toHaveLength(0);
  });

  it('el borrado es lógico y conserva lo que la cuenta dejó', async () => {
    const aspirante = await crearCuenta('APPLICANT');
    const id = await inscripcionEnviada(aspirante.cookie);

    await request(app).delete(`/admin/users/${aspirante.id}`).set('Cookie', adminCookie);

    const user = await prisma.user.findUnique({ where: { id: aspirante.id } });
    const enrollment = await prisma.enrollment.findUnique({ where: { id } });
    expect(user?.deletedAt).not.toBeNull();
    expect(enrollment).not.toBeNull();
  });

  it('rechaza crear o asignar el rol de estudiante', async () => {
    const creado = await request(app)
      .post('/admin/users')
      .set('Cookie', adminCookie)
      .send({
        documentType: 'CC',
        documentNumber: `${PREFIJO_DOC}${sufijo()}`,
        email: `nuevo${sufijo()}${DOMINIO}`,
        role: 'STUDENT',
        password: 'contrasena-de-prueba',
      });
    expect(creado.status).toBe(400);

    const cuenta = await crearCuenta('APPLICANT');
    const editado = await request(app)
      .patch(`/admin/users/${cuenta.id}`)
      .set('Cookie', adminCookie)
      .send({ role: 'STUDENT' });
    expect(editado.status).toBe(400);
  });

  it('nadie se elimina ni se degrada a sí mismo', async () => {
    const borrado = await request(app).delete(`/admin/users/${adminId}`).set('Cookie', adminCookie);
    expect(borrado.status).toBe(403);

    const degradado = await request(app)
      .patch(`/admin/users/${adminId}`)
      .set('Cookie', adminCookie)
      .send({ role: 'APPLICANT' });
    expect(degradado.status).toBe(403);
  });

  it('restablece una contraseña y la anterior deja de servir', async () => {
    const cuenta = await crearCuenta('APPLICANT');

    await request(app)
      .post(`/admin/users/${cuenta.id}/password`)
      .set('Cookie', adminCookie)
      .send({ password: 'contrasena-nueva-larga' });

    const conLaVieja = await request(app)
      .post('/auth/login')
      .send({ email: cuenta.email, password: 'contrasena-de-prueba' });
    const conLaNueva = await request(app)
      .post('/auth/login')
      .send({ email: cuenta.email, password: 'contrasena-nueva-larga' });

    expect(conLaVieja.status).toBe(401);
    expect(conLaNueva.status).toBe(200);
  });
});

describe('la cuenta de sistema', () => {
  async function idDelAdminOriginal(): Promise<string | null> {
    const system = await prisma.user.findFirst({ where: { isSystem: true } });
    return system?.id ?? null;
  }

  it('no se puede eliminar ni degradar, pero sí restablecer su contraseña', async () => {
    const systemId = await idDelAdminOriginal();
    if (!systemId) {
      // Sin cuenta de sistema sembrada no hay nada que comprobar.
      expect(systemId).toBeNull();
      return;
    }

    const borrado = await request(app).delete(`/admin/users/${systemId}`).set('Cookie', adminCookie);
    expect(borrado.status).toBe(403);

    const degradado = await request(app)
      .patch(`/admin/users/${systemId}`)
      .set('Cookie', adminCookie)
      .send({ role: 'APPLICANT' });
    expect(degradado.status).toBe(403);

    // Protegerla de un olvido de contraseña la dejaría inservible, no protegida.
    const reset = await request(app)
      .post(`/admin/users/${systemId}/password`)
      .set('Cookie', adminCookie)
      .send({ password: 'contrasena-restablecida' });
    expect(reset.status).toBe(204);

    const sigueSiendoAdmin = await prisma.user.findUnique({ where: { id: systemId } });
    expect(sigueSiendoAdmin?.role).toBe('ADMIN');
    expect(sigueSiendoAdmin?.deletedAt).toBeNull();
  });
});

describe('periodos académicos', () => {
  it('rechaza un código repetido', async () => {
    const response = await request(app)
      .post('/admin/periods')
      .set('Cookie', adminCookie)
      .send({
        code: 'ADMIN-1',
        opensAt: '2030-01-01',
        closesAt: '2030-06-01',
        enrollmentFeeAmount: 90_000,
      });

    expect(response.status).toBe(400);
  });

  it('rechaza un cierre anterior a la apertura', async () => {
    const response = await request(app)
      .post('/admin/periods')
      .set('Cookie', adminCookie)
      .send({
        code: '2099-1',
        opensAt: '2099-06-01',
        closesAt: '2099-01-01',
        enrollmentFeeAmount: 90_000,
      });

    expect(response.status).toBe(400);
    expect(response.body.error.details).toHaveProperty('closesAt');
  });

  it('cambiar la tarifa no altera los recibos ya emitidos', async () => {
    const aspirante = await crearCuenta('APPLICANT');
    const id = await inscripcionEnviada(aspirante.cookie);

    await request(app)
      .patch(`/admin/periods/${periodId}`)
      .set('Cookie', adminCookie)
      .send({
        opensAt: '2020-01-01',
        closesAt: '2099-01-01',
        enrollmentFeeAmount: 120_000,
        isActive: true,
      });

    const recibo = await prisma.paymentReceipt.findUnique({ where: { enrollmentId: id } });
    expect(Number(recibo?.amount)).toBe(85_000);

    await prisma.academicPeriod.update({
      where: { id: periodId },
      data: { enrollmentFeeAmount: 85_000 },
    });
  });
});
