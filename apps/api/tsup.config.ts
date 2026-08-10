import { defineConfig } from 'tsup';

// Los paquetes de `packages/` se consumen como TypeScript fuente, así que el
// build los empaqueta aquí dentro. Sin esto, el `dist` del API importaría
// archivos .ts que Node no sabe ejecutar.
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node22',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  noExternal: [/^@repo\//],
});
