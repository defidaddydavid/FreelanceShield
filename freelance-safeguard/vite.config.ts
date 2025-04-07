import { defineConfig } from 'vitest/config';
import path from 'path';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  plugins: [
    // Add React plugin for JSX support with explicit runtime configuration
    react({
      jsxRuntime: 'automatic',
      jsxImportSource: 'react',
      babel: {
        plugins: [
          // Add this to ensure path aliases work correctly
          ['module-resolver', {
            root: ['./src'],
            alias: {
              '@': './src',
            },
          }],
        ],
      },
    }),
    // Add SVGR plugin for importing SVGs as React components
    svgr({ 
      include: '**/*.svg',
      svgrOptions: {
        exportType: 'named',
        ref: true,
        svgo: true,
        titleProp: true,
      },
    }),
  ],
  // Test configuration
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}', 'test/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  // Enhanced path resolution
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, './src') },
      // Add explicit aliases for commonly used paths
      { find: '@/lib', replacement: path.resolve(__dirname, './src/lib') },
      { find: '@/components', replacement: path.resolve(__dirname, './src/components') },
      { find: '@/contexts', replacement: path.resolve(__dirname, './src/contexts') },
    ],
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
  },
  
  // Build optimization
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true,
    // Optimize chunks for Solana UI components
    rollupOptions: {
      output: {
        manualChunks: {
          'solana-wallet': [
            '@solana/wallet-adapter-react',
            '@solana/wallet-adapter-wallets',
            '@solana/web3.js',
          ],
          'ui-core': [
            'react',
            'react-dom',
            'react-router-dom',
          ],
        },
      },
    },
  },
  // Development server configuration
  server: {
    port: 3000,
    open: true,
    host: true, // Listen on all addresses
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..'],
    },
  },
  // Define environment variables
  define: {
    // Ensure process.env is available in the client
    'process.env': process.env,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      '@solana/wallet-adapter-react',
      '@solana/wallet-adapter-wallets',
      '@solana/web3.js',
      'react',
      'react-dom',
      'react-router-dom',
      'clsx',
      'tailwind-merge',
    ],
    esbuildOptions: {
      target: 'es2020',
    },
  },
});
