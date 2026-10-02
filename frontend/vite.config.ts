import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // Pre-empaquetar framer-motion evita recargas por "Outdated Optimize Dep" en desarrollo
  optimizeDeps: {
    include: ['framer-motion'],
  },
  server: {
    port: 5173,
    // Proxy en desarrollo: el navegador ve /api como mismo origen, así las cookies
    // HttpOnly + SameSite=Strict funcionan sin configuración extra.
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
    },
  },
});
