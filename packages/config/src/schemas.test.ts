import { describe, expect, it } from 'vitest';
import { apiEnvSchema, seedEnvSchema, webEnvSchema } from './schemas';
import { formatEnvError } from './format';

const entornoValido = {
  DATABASE_URL: 'postgresql://sion:sion@localhost:5432/sion',
  CORS_ORIGIN: 'http://localhost:5173',
};

describe('apiEnvSchema', () => {
  it('acepta un entorno válido y aplica los valores por defecto', () => {
    const result = apiEnvSchema.safeParse(entornoValido);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.PORT).toBe(3000);
    expect(result.data.NODE_ENV).toBe('development');
    expect(result.data.BCRYPT_ROUNDS).toBe(12);
  });

  it('rechaza el entorno si falta una variable requerida', () => {
    const result = apiEnvSchema.safeParse({ CORS_ORIGIN: 'http://localhost:5173' });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.map((i) => i.path[0])).toContain('DATABASE_URL');
  });

  it('rechaza una variable presente con formato inválido', () => {
    const result = apiEnvSchema.safeParse({ ...entornoValido, PORT: 'no-soy-un-puerto' });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.map((i) => i.path[0])).toContain('PORT');
  });

  it('reporta todas las variables inválidas en una sola pasada', () => {
    // Este es el punto: sin esto, configurar un servidor nuevo se convierte en
    // arrancar, corregir una variable, arrancar otra vez.
    const result = apiEnvSchema.safeParse({
      DATABASE_URL: 'no-es-url',
      CORS_ORIGIN: 'tampoco',
      PORT: 'abc',
      BCRYPT_ROUNDS: '99',
    });

    expect(result.success).toBe(false);
    if (result.success) return;

    const nombres = result.error.issues.map((i) => String(i.path[0]));
    expect(nombres).toEqual(
      expect.arrayContaining(['DATABASE_URL', 'CORS_ORIGIN', 'PORT', 'BCRYPT_ROUNDS']),
    );
  });

  it('no exige las credenciales de siembra para arrancar el servidor', () => {
    // El servidor en producción no tiene por qué conocer la contraseña del
    // administrador original.
    expect(apiEnvSchema.safeParse(entornoValido).success).toBe(true);
  });
});

describe('seedEnvSchema', () => {
  const siembraValida = {
    DATABASE_URL: 'postgresql://sion:sion@localhost:5432/sion',
    SEED_ADMIN_DOCUMENT_TYPE: 'CC',
    SEED_ADMIN_DOCUMENT_NUMBER: '1000000000',
    SEED_ADMIN_EMAIL: 'admin@unac.edu.co',
    SEED_ADMIN_PASSWORD: 'contrasena-larga',
  };

  it('acepta una configuración de siembra completa', () => {
    expect(seedEnvSchema.safeParse(siembraValida).success).toBe(true);
  });

  it('rechaza un tipo de documento que no existe', () => {
    const result = seedEnvSchema.safeParse({
      ...siembraValida,
      SEED_ADMIN_DOCUMENT_TYPE: 'XX',
    });
    expect(result.success).toBe(false);
  });

  it('rechaza una contraseña demasiado corta', () => {
    const result = seedEnvSchema.safeParse({ ...siembraValida, SEED_ADMIN_PASSWORD: 'corta' });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.map((i) => i.path[0])).toContain('SEED_ADMIN_PASSWORD');
  });
});

describe('webEnvSchema', () => {
  it('exige la URL del API', () => {
    expect(webEnvSchema.safeParse({}).success).toBe(false);
    expect(webEnvSchema.safeParse({ VITE_API_URL: 'http://localhost:3000' }).success).toBe(true);
  });
});

describe('formatEnvError', () => {
  it('nombra la variable de un secreto inválido sin imprimir su valor', () => {
    const secreto = 'esto-no-debe-aparecer-jamas';
    const result = seedEnvSchema.safeParse({
      DATABASE_URL: 'postgresql://sion:sion@localhost:5432/sion',
      SEED_ADMIN_DOCUMENT_TYPE: 'CC',
      SEED_ADMIN_DOCUMENT_NUMBER: '1000000000',
      SEED_ADMIN_EMAIL: 'no-es-un-correo',
      SEED_ADMIN_PASSWORD: secreto.slice(0, 3),
    });

    expect(result.success).toBe(false);
    if (result.success) return;

    const mensaje = formatEnvError(result.error, 'prueba');
    expect(mensaje).toContain('SEED_ADMIN_PASSWORD');
    expect(mensaje).not.toContain(secreto.slice(0, 3));
  });

  it('lista cada problema en su propia línea', () => {
    const result = apiEnvSchema.safeParse({ DATABASE_URL: 'x', CORS_ORIGIN: 'y' });
    expect(result.success).toBe(false);
    if (result.success) return;

    const mensaje = formatEnvError(result.error, 'prueba');
    expect(mensaje).toContain('DATABASE_URL');
    expect(mensaje).toContain('CORS_ORIGIN');
    expect(mensaje).toContain('2 variables');
  });
});
