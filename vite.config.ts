import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
    fs: {
      deny: ['**/_backup/**', '**/legacy/**', '**/backup/**']
    }
  },
  optimizeDeps: {
    exclude: ['legacy', '_backup'],
    entries: ['./src/**/*.{ts,tsx,js,jsx}']
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  css: {
    postcss: './postcss.config.mjs',
  },
});
