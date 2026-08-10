import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { parseWebEnv } from '@repo/config/web';

export default defineConfig(({ mode }) => {
  // Valida el entorno en tiempo de CONSTRUCCIÓN, que es cuando Vite resuelve
  // las variables. Este es el control que de verdad importa: corre en Vercel y
  // rompe el despliegue en vez de dejar publicar un bundle que apunta a nada.
  parseWebEnv(loadEnv(mode, process.cwd(), ''), 'apps/web/.env');

  return {
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
    },
  };
});
