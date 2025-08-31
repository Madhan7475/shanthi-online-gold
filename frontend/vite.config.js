import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:9000',
        changeOrigin: true,
        secure: false
      },
      '/uploads': {
        target: 'http://localhost:9000', // Serve uploaded files from backend
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // All dependencies in node_modules go into a separate chunk
            return 'vendor';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000 // Optional: increase limit to 1MB if needed
  }
});
