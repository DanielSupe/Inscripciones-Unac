import js from '@eslint/js';
import tseslint from 'typescript-eslint';

/** Reglas comunes a todos los paquetes del repositorio. */
export const base = tseslint.config(
  {
    ignores: ['dist/**', 'build/**', 'coverage/**', '.turbo/**', 'node_modules/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // CLAUDE.md: `any` está prohibido; usa `unknown` y estrecha el tipo.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // CLAUDE.md: nada de catch vacío ni console.log como manejo de errores.
      'no-empty': ['error', { allowEmptyCatch: false }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
    },
  },
);
