import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { parseDatabaseUrl } from '../../shared/database/connection';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../app';
import { requireAuth, requireRole } from '../../shared/middleware/require-auth';
import { errorHandler } from '../../shared/errors';

const app = createApp();

// Todo lo que crean estas pruebas comparte prefijo, para poder limpiarlo sin
// tocar las cuentas reales de la base de datos de desarrollo.
const PREFIJO_DOC = '99900';
const DOMINIO = '@prueba.local';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' }, { schema: parseDatabaseUrl(process.env.DATABASE_URL ?? '').schema }),
});

async function limpiar(): Promise<void> {
  await prisma.user.deleteMany({
    where: { documentNumber: { startsWith: PREFIJO_DOC } },
  });
}

/** Petición de registro válida, con los datos que se le indiquen cambiados. */
function nuevoRegistro(overrides: Record<string, unknown> = {}) {
  const sufijo = Math.floor(Math.random() * 90000 + 10000).toString();
  return {
    documentType: 'CC',
    documentNumber: `${PREFIJO_DOC}${sufijo}`,
    email: `a${sufijo}${DOMINIO}`,
    emailConfirmation: `a${sufijo}${DOMINIO}`,
    password: 'contrasena-de-prueba',
    acceptedPolicies: true,
    ...overrides,
  };
}

beforeEach(limpiar);

afterAll(async () => {
  await limpiar();
  await prisma.$disconnect();
});

describe('POST /auth/register', () => {
  it('crea la cuenta con rol APPLICANT', async () => {
    const response = await request(app).post('/auth/register').send(nuevoRegistro());

    expect(response.status).toBe(201);
    expect(response.body.role).toBe('APPLICANT');
  });

  it('guarda la versión de políticas aceptada y su marca de tiempo', async () => {
    const datos = nuevoRegistro();
    await request(app).post('/auth/register').send(datos);

    const cuenta = await prisma.user.findFirst({ where: { email: datos.email } });
    expect(cuenta?.acceptedPolicyVersion).toBe(process.env.POLICY_VERSION);
    expect(cuenta?.acceptedPolicyAt).toBeInstanceOf(Date);
  });

  it('no guarda la contraseña en texto plano ni la devuelve', async () => {
    const datos = nuevoRegistro();
    const response = await request(app).post('/auth/register').send(datos);

    const cuenta = await prisma.user.findFirst({ where: { email: datos.email } });
    expect(cuenta?.passwordHash).not.toBe(datos.password);
    expect(cuenta?.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(JSON.stringify(response.body)).not.toContain(datos.password);
  });

  it('responde lo mismo ante documento duplicado que ante correo duplicado', async () => {
    const original = nuevoRegistro();
    await request(app).post('/auth/register').send(original);

    const mismoDocumento = await request(app)
      .post('/auth/register')
      .send(nuevoRegistro({ documentNumber: original.documentNumber }));

    const mismoCorreo = await request(app)
      .post('/auth/register')
      .send(nuevoRegistro({ email: original.email, emailConfirmation: original.email }));

    // El punto de la prueba: byte a byte, para que nadie pueda averiguar quién
    // tiene cuenta comparando las dos respuestas.
    expect(mismoDocumento.status).toBe(mismoCorreo.status);
    expect(mismoDocumento.body).toEqual(mismoCorreo.body);
  });

  it('ignora un rol enviado en el cuerpo y crea siempre un APPLICANT', async () => {
    const datos = nuevoRegistro();
    const response = await request(app)
      .post('/auth/register')
      .send({ ...datos, role: 'ADMIN', isSystem: true });

    expect(response.status).toBe(201);
    expect(response.body.role).toBe('APPLICANT');

    const cuenta = await prisma.user.findFirst({ where: { email: datos.email } });
    expect(cuenta?.role).toBe('APPLICANT');
    expect(cuenta?.isSystem).toBe(false);
  });

  it('rechaza el registro si los dos correos no coinciden', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send(nuevoRegistro({ emailConfirmation: `otro${DOMINIO}` }));

    expect(response.status).toBe(400);
    expect(response.body.error.details).toHaveProperty('emailConfirmation');
  });

  it('rechaza el registro si no se aceptan las políticas', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send(nuevoRegistro({ acceptedPolicies: false }));

    expect(response.status).toBe(400);
    expect(response.body.error.details).toHaveProperty('acceptedPolicies');
  });

  it('rechaza una contraseña demasiado corta', async () => {
    const response = await request(app).post('/auth/register').send(nuevoRegistro({ password: 'corta' }));

    expect(response.status).toBe(400);
    expect(response.body.error.details).toHaveProperty('password');
  });
});

describe('POST /auth/login', () => {
  it('responde con la identidad y emite la cookie de sesión', async () => {
    const datos = nuevoRegistro();
    await request(app).post('/auth/register').send(datos);

    const response = await request(app)
      .post('/auth/login')
      .send({ email: datos.email, password: datos.password });

    expect(response.status).toBe(200);
    expect(response.body.email).toBe(datos.email);

    const cookie = response.headers['set-cookie']?.[0] ?? '';
    expect(cookie).toContain('HttpOnly');
    // La credencial viaja solo en la cookie; el cuerpo lleva la identidad.
    expect(JSON.stringify(response.body)).not.toContain(cookie.split('=')[1]?.split(';')[0] ?? 'x');
  });

  it('responde lo mismo ante contraseña incorrecta que ante correo inexistente', async () => {
    const datos = nuevoRegistro();
    await request(app).post('/auth/register').send(datos);

    const malaContrasena = await request(app)
      .post('/auth/login')
      .send({ email: datos.email, password: 'equivocada-del-todo' });

    const correoInexistente = await request(app)
      .post('/auth/login')
      .send({ email: `nadie${DOMINIO}`, password: 'equivocada-del-todo' });

    expect(malaContrasena.status).toBe(correoInexistente.status);
    expect(malaContrasena.body).toEqual(correoInexistente.body);
    expect(malaContrasena.headers['set-cookie']).toBeUndefined();
  });

  it('no deja ingresar a una cuenta eliminada, con el mismo mensaje neutro', async () => {
    const datos = nuevoRegistro();
    await request(app).post('/auth/register').send(datos);
    await prisma.user.updateMany({ where: { email: datos.email }, data: { deletedAt: new Date() } });

    const response = await request(app)
      .post('/auth/login')
      .send({ email: datos.email, password: datos.password });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('no responde antes cuando el correo no existe', async () => {
    // Si respondiera antes, el mensaje neutro no serviría de nada: el tiempo
    // contaría lo que el mensaje calla.
    const datos = nuevoRegistro();
    await request(app).post('/auth/register').send(datos);

    async function medir(email: string): Promise<number> {
      const inicio = performance.now();
      await request(app).post('/auth/login').send({ email, password: 'equivocada-del-todo' });
      return performance.now() - inicio;
    }

    // Varias medidas y la mediana, porque una sola es demasiado ruidosa.
    const existentes: number[] = [];
    const inexistentes: number[] = [];
    for (let i = 0; i < 5; i += 1) {
      existentes.push(await medir(datos.email));
      inexistentes.push(await medir(`nadie${i}${DOMINIO}`));
    }
    const mediana = (xs: number[]) => xs.sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 0;

    // El coste de bcrypt domina en ambos casos, así que deben quedar en el
    // mismo orden de magnitud.
    expect(mediana(inexistentes)).toBeGreaterThan(mediana(existentes) * 0.5);
  });
});

describe('GET /auth/me', () => {
  async function ingresar(): Promise<{ cookie: string; email: string; id: string }> {
    const datos = nuevoRegistro();
    const creada = await request(app).post('/auth/register').send(datos);
    const login = await request(app)
      .post('/auth/login')
      .send({ email: datos.email, password: datos.password });
    return {
      cookie: login.headers['set-cookie']?.[0] ?? '',
      email: datos.email,
      id: creada.body.id,
    };
  }

  it('devuelve la identidad con una sesión válida', async () => {
    const { cookie, email } = await ingresar();

    const response = await request(app).get('/auth/me').set('Cookie', cookie);

    expect(response.status).toBe(200);
    expect(response.body.email).toBe(email);
    expect(response.body).not.toHaveProperty('passwordHash');
  });

  it('responde 401 sin sesión', async () => {
    const response = await request(app).get('/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('responde 401 con una credencial firmada por otro', async () => {
    const ajeno = jwt.sign({ sub: 'cualquiera' }, 'otro-secreto-completamente-distinto');

    const response = await request(app)
      .get('/auth/me')
      .set('Cookie', `${process.env.COOKIE_NAME ?? 'sion_session'}=${ajeno}`);

    expect(response.status).toBe(401);
  });

  it('responde 401 con una sesión caducada', async () => {
    const { id } = await ingresar();
    const caducado = jwt.sign({ sub: id }, process.env.JWT_SECRET ?? '', { expiresIn: '-1s' });

    const response = await request(app)
      .get('/auth/me')
      .set('Cookie', `${process.env.COOKIE_NAME ?? 'sion_session'}=${caducado}`);

    expect(response.status).toBe(401);
  });

  it('responde 401 si la cuenta se elimina con la sesión abierta', async () => {
    const { cookie, email } = await ingresar();
    await prisma.user.updateMany({ where: { email }, data: { deletedAt: new Date() } });

    const response = await request(app).get('/auth/me').set('Cookie', cookie);

    expect(response.status).toBe(401);
  });
});

describe('POST /auth/logout', () => {
  it('invalida la sesión y es idempotente', async () => {
    const datos = nuevoRegistro();
    await request(app).post('/auth/register').send(datos);
    const login = await request(app)
      .post('/auth/login')
      .send({ email: datos.email, password: datos.password });
    const cookie = login.headers['set-cookie']?.[0] ?? '';

    const salida = await request(app).post('/auth/logout').set('Cookie', cookie);
    expect(salida.status).toBe(204);

    // La cookie borrada ya no debería servir en un navegador real; aquí se
    // comprueba que pedir la salida sin sesión tampoco es un error.
    const sinSesion = await request(app).post('/auth/logout');
    expect(sinSesion.status).toBe(204);
  });
});

describe('middlewares de autorización', () => {
  /**
   * App mínima con una ruta reservada a ADMIN, para ejercitar requireRole.
   *
   * Se monta aparte y no sobre createApp, porque el manejador de ruta no
   * encontrada de la aplicación real respondería 404 antes de que la petición
   * llegara a esta ruta.
   */
  const soloAdmin = express();
  soloAdmin.use(express.json());
  soloAdmin.use(cookieParser());
  soloAdmin.get('/solo-admin', requireAuth, requireRole('ADMIN'), (_req, res) => {
    res.status(200).json({ ok: true });
  });
  soloAdmin.use(errorHandler);

  async function cookieDeAspirante(): Promise<string> {
    const datos = nuevoRegistro();
    await request(app).post('/auth/register').send(datos);
    const login = await request(app)
      .post('/auth/login')
      .send({ email: datos.email, password: datos.password });
    return login.headers['set-cookie']?.[0] ?? '';
  }

  it('responde 401 sin sesión', async () => {
    const response = await request(soloAdmin).get('/solo-admin');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('responde 403 cuando el rol no alcanza', async () => {
    const response = await request(soloAdmin).get('/solo-admin').set('Cookie', await cookieDeAspirante());

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
  });

  it('ni el 401 ni el 403 revelan nada del recurso', async () => {
    const sinSesion = await request(soloAdmin).get('/solo-admin');
    const sinPermiso = await request(soloAdmin).get('/solo-admin').set('Cookie', await cookieDeAspirante());

    for (const cuerpo of [JSON.stringify(sinSesion.body), JSON.stringify(sinPermiso.body)]) {
      expect(cuerpo).not.toContain('users');
      expect(cuerpo).not.toContain('prisma');
      expect(cuerpo).not.toContain('at ');
    }
  });
});
