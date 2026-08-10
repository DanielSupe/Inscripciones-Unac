import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { base } from './base.js';

/**
 * Configuración del frontend.
 *
 * Hace cumplir dos reglas de CLAUDE.md: el frontend nunca habla con la base de
 * datos, y los componentes nunca llaman `fetch` directo — todo el acceso a red
 * pasa por el cliente único de `src/lib/`.
 */
export const react = [
  ...base,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@prisma/client',
              message: 'El frontend nunca habla con la base de datos.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/lib/**'],
    rules: {
      'no-restricted-globals': [
        'error',
        {
          name: 'fetch',
          message: 'Usa el cliente HTTP de src/lib/http.ts, no fetch directo.',
        },
      ],
    },
  },
];
