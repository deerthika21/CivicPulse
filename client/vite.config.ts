import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  server: {
    port: 5173,
    proxy: {
      // CP_API_TARGET lets a second dev stack (e.g. dev:demo on :5100) run beside the main one.
      '/api': { target: process.env.CP_API_TARGET ?? 'http://localhost:5000', changeOrigin: true },
    },
  },
});
