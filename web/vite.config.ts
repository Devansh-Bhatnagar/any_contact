import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        // Automatically proxies to local backend on 5034 during local development
        target: process.env.VITE_BACKEND_TARGET || 'http://localhost:5034',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
