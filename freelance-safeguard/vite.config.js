import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    },
  },
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, 'src') },
      { find: /^src\/(.*)/, replacement: path.resolve(__dirname, 'src/$1') },
      { find: /^\/src\/(.*)/, replacement: path.resolve(__dirname, 'src/$1') },
      { find: /^\.\/src\/(.*)/, replacement: path.resolve(__dirname, 'src/$1') }
    ]
  },
  server: {
    port: 3000
  },
  // Ensure Vite doesn't try to process API files
  optimizeDeps: {
    exclude: ['api/**/*.js'],
  },
});
