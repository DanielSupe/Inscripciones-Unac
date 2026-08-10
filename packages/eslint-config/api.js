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
    files: ['**/*.repository.ts', 'src/shared/database/**', 'prisma/**'],
    rules: {
      '@typescript-eslint/no-restricted-imports': 'off',
    },
  },
];
