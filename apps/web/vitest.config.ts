import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  define: {
    // El bundle real recibe estas variables de Vite en tiempo de construcción;
    // en las pruebas se fijan aquí para no depender de un .env.
    'import.meta.env.VITE_API_URL': JSON.stringify('http://localhost:3000'),
  },
});
