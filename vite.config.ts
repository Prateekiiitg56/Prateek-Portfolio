import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Port of the local API server (server/dev-api.cjs). Read from .env.local or the shell.
const devApiPort = loadEnv("development", ".", "").DEV_API_PORT || "8787";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Local dev only: forward /api/* to our dev API server (see server/dev-api.cjs)
      '/api': {
        target: `http://localhost:${devApiPort}`,
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three'],
          'gsap': ['gsap'],
          'vendor': ['react', 'react-dom', 'react-router-dom']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  optimizeDeps: {
    include: ['three', 'gsap', 'lenis']
  }
});
