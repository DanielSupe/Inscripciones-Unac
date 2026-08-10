import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

interface Resultado {
  code: number | null;
  stderr: string;
  stdout: string;
}

/**
 * Arranca el API como proceso hijo con el entorno que se le indique.
 *
 * Es más lenta que una prueba unitaria, pero es la única que verifica el
 * requisito real: que el proceso *muera* cuando la configuración está mal. Una
 * prueba sobre el esquema comprueba la validación, no el arranque.
 */
function arrancarApi(env: NodeJS.ProcessEnv): Promise<Resultado> {
  return new Promise((resolve) => {
    const child = execFile(
      process.execPath,
      ['--import', 'tsx', path.join(apiRoot, 'src', 'index.ts')],
      { cwd: apiRoot, env, timeout: 15_000 },
      (error, stdout, stderr) => {
        resolve({
          code: typeof error?.code === 'number' ? error.code : (child.exitCode ?? 0),
          stdout,
          stderr,
        });
      },
    );
  });
}

/** Entorno mínimo, sin heredar el `.env` del desarrollador. */
const entornoBase: NodeJS.ProcessEnv = {
  PATH: process.env.PATH,
  SystemRoot: process.env.SystemRoot,
  NODE_ENV: 'test',
};

describe('arranque del API', () => {
  it('no arranca y nombra la variable cuando falta DATABASE_URL', async () => {
    const { code, stderr } = await arrancarApi({
      ...entornoBase,
      CORS_ORIGIN: 'http://localhost:5173',
    });

    expect(code).not.toBe(0);
    expect(stderr).toContain('DATABASE_URL');
    expect(stderr).toContain('Configuración inválida');
  });

  it('no arranca y nombra la variable cuando falta CORS_ORIGIN', async () => {
    const { code, stderr } = await arrancarApi({
      ...entornoBase,
      DATABASE_URL: 'postgresql://sion:sion@localhost:5432/sion',
    });

    expect(code).not.toBe(0);
    expect(stderr).toContain('CORS_ORIGIN');
  });

  it('lista todas las variables que faltan de una sola vez', async () => {
    const { code, stderr } = await arrancarApi(entornoBase);

    expect(code).not.toBe(0);
    expect(stderr).toContain('DATABASE_URL');
    expect(stderr).toContain('CORS_ORIGIN');
  });

  it('no imprime el valor de un secreto inválido', async () => {
    const secreto = 'valor-secretisimo-que-no-debe-salir';
    const { stderr, stdout } = await arrancarApi({
      ...entornoBase,
      DATABASE_URL: secreto,
      CORS_ORIGIN: 'http://localhost:5173',
    });

    expect(stderr).toContain('DATABASE_URL');
    expect(stderr).not.toContain(secreto);
    expect(stdout).not.toContain(secreto);
  });
});
