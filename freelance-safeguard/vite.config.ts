import { defineConfig } from 'vitest/config';
import path from 'path';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

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
    // Add node polyfills for Privy and Coinbase Wallet SDK
    nodePolyfills(),
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
      // Add compatibility layer for wallet adapter
      { find: '@solana/wallet-adapter-react', replacement: path.resolve(__dirname, './src/lib/solana/wallet-adapter-compat') },
      { find: '@solana/wallet-adapter-react-ui', replacement: path.resolve(__dirname, './src/lib/solana/wallet-adapter-compat') }
    ],
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
  },
  
  // Build optimization
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true,
    // Increase memory limit for node
    chunkSizeWarningLimit: 2000,
    // Optimize chunks for better performance
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Create chunk for Solana web3.js and anchor
          if (id.includes('@solana/web3.js') || id.includes('@project-serum/anchor')) {
            return 'blockchain';
          }
          
          // Create chunk for React and related libraries
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
            return 'ui-core';
          }
          
          // Create chunk for Privy authentication
          if (id.includes('@privy-io/react-auth')) {
            return 'auth-providers';
          }
          
          // Create chunk for UI components
          if (id.includes('@radix-ui/') || 
              id.includes('lucide-react') || 
              id.includes('class-variance-authority') || 
              id.includes('clsx') || 
              id.includes('tailwind-merge')) {
            return 'ui-components';
          }
        }
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
      '@solana/web3.js',
      '@project-serum/anchor',
      '@privy-io/react-auth',
      'react',
      'react-dom',
      'react-router-dom',
      'clsx',
      'tailwind-merge',
    ],
    esbuildOptions: {
      target: 'es2020',
      // Exclude problematic dependencies
      define: {
        global: 'globalThis',
      },
    },
  },
});
