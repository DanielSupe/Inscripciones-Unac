import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const seedScript = path.join(apiRoot, 'prisma', 'seed.ts');

const DATABASE_URL = process.env.DATABASE_URL;
const admin = {
  SEED_ADMIN_DOCUMENT_TYPE: 'CC',
  SEED_ADMIN_DOCUMENT_NUMBER: '9999999001',
  SEED_ADMIN_EMAIL: 'admin.prueba@unac.edu.co',
  SEED_ADMIN_PASSWORD: 'contrasena-de-prueba',
  BCRYPT_ROUNDS: '4',
};

/** Sin base de datos accesible esta prueba no puede decir nada útil. */
const hayBaseDeDatos = Boolean(DATABASE_URL);

function sembrar(extra: Record<string, string> = {}): Promise<{ code: number; stderr: string }> {
  return new Promise((resolve) => {
    execFile(
      process.execPath,
      ['--import', 'tsx', seedScript],
      {
        cwd: apiRoot,
        env: { ...process.env, ...admin, ...extra },
        timeout: 30_000,
      },
      (error, _stdout, stderr) => {
        resolve({ code: typeof error?.code === 'number' ? error.code : 0, stderr });
      },
    );
  });
}

const prisma = hayBaseDeDatos
  ? new PrismaClient({ adapter: new PrismaPg({ connectionString: DATABASE_URL ?? '' }) })
  : null;

async function contarAdmins(): Promise<number> {
  if (!prisma) return 0;
  return prisma.user.count({ where: { isSystem: true } });
}

describe.skipIf(!hayBaseDeDatos)('siembra del administrador original', () => {
  // Estas pruebas corren contra el esquema de pruebas, no contra el de
  // desarrollo, así que pueden ser la única cuenta de sistema sin tocar el
  // administrador local. Ese aislamiento lo prepara vitest.global-setup.ts;
  // antes de existir, guardar y restaurar la cuenta era un apaño y falló.
  beforeAll(async () => {
    await prisma?.user.deleteMany({ where: { isSystem: true } });
  });

  afterAll(async () => {
    await prisma?.user.deleteMany({ where: { isSystem: true } });
    await prisma?.$disconnect();
  });

  it('crea exactamente una cuenta de administrador la primera vez', async () => {
    const { code } = await sembrar();

    expect(code).toBe(0);
    expect(await contarAdmins()).toBe(1);
  });

  it('no duplica la cuenta al volver a sembrar', async () => {
    const { code } = await sembrar();

    expect(code).toBe(0);
    expect(await contarAdmins()).toBe(1);
  });

  it('reconcilia el correo sobre la misma cuenta', async () => {
    const nuevoCorreo = 'rector.prueba@unac.edu.co';
    const { code } = await sembrar({ SEED_ADMIN_EMAIL: nuevoCorreo });

    expect(code).toBe(0);
    expect(await contarAdmins()).toBe(1);

    const cuenta = await prisma?.user.findFirst({ where: { isSystem: true } });
    expect(cuenta?.email).toBe(nuevoCorreo);
  });

  it('cambia la contraseña almacenada sin crear otra cuenta', async () => {
    const antes = await prisma?.user.findFirst({ where: { isSystem: true } });
    const { code } = await sembrar({ SEED_ADMIN_PASSWORD: 'otra-contrasena-distinta' });

    expect(code).toBe(0);
    const despues = await prisma?.user.findFirst({ where: { isSystem: true } });
    expect(despues?.passwordHash).not.toBe(antes?.passwordHash);
    expect(await contarAdmins()).toBe(1);
  });

  it('nunca guarda la contraseña en texto plano', async () => {
    const cuenta = await prisma?.user.findFirst({ where: { isSystem: true } });

    expect(cuenta?.passwordHash).not.toContain(admin.SEED_ADMIN_PASSWORD);
    expect(cuenta?.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it('aborta sin crear una segunda cuenta si cambia el documento', async () => {
    const { code, stderr } = await sembrar({ SEED_ADMIN_DOCUMENT_NUMBER: '9999999002' });

    expect(code).not.toBe(0);
    expect(stderr).toContain('Conflicto de identidad');
    expect(await contarAdmins()).toBe(1);
  });
});
