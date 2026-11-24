import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      // Módulos nativos (.node) no se empaquetan dentro del bundle JS de Vite.
      external: ['better-sqlite3'],
    },
  },
});
