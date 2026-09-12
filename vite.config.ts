import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5273,
    proxy: {
      // News API runs alongside vite; see `npm run dev:api`.
      '/api': { target: 'http://localhost:5274', changeOrigin: true },
    },
  },
});
