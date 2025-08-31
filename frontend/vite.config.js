import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:9000', // Your backend port
        changeOrigin: true,
        secure: false
      },
      '/uploads': {
        target: 'http://localhost:9000', // Serve uploaded files from backend
        changeOrigin: true,
        secure: false
      }
    }
  }
});
