import globals from 'globals';
import { base } from './base.js';

/**
 * Configuración del backend.
 *
 * Hace cumplir mecánicamente la regla de capas de CLAUDE.md: el cliente de
 * Prisma solo puede importarse desde un `*.repository.ts`. Si esta regla salta,
 * no es un aviso de estilo: es lógica de datos filtrándose fuera de su capa.
 */
export const api = [
  ...base,
  {
    files: ['**/*.ts'],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@prisma/client',
              message:
                'Solo los archivos *.repository.ts pueden tocar el cliente de Prisma. Pasa por el repository de su módulo.',
              allowTypeImports: true,
            },
          ],
        },
      ],
    },
  },
  {
    // El repository es la única capa autorizada; el seed corre fuera de la app.
    //
    // Los `*.integration.test.ts` también quedan exentos: una prueba de
    // integración necesita preparar y limpiar el estado de la base de datos
    // directamente, y hacerlo a través de la aplicación probaría el código con
    // el código. La excepción es deliberadamente estrecha: los tests normales
    // siguen sujetos a la regla, para que un fallo de capas no se cuele
    // disfrazado de prueba.
    files: [
      '**/*.repository.ts',
      '**/*.integration.test.ts',
      'src/shared/database/**',
      'prisma/**',
    ],
    rules: {
      '@typescript-eslint/no-restricted-imports': 'off',
    },
  },
];
