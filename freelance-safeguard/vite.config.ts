import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: "http://localhost:8081",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, "")
      },
      // Add proxy for regulatory compliance API if needed
      "/regulatory-api": {
        target: "http://localhost:8083",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/regulatory-api/, "")
      }
    },
    // Add history fallback for SPA routing
    historyApiFallback: {
      rewrites: [
        { from: /^\/regulatory-compliance.*/, to: '/index.html' },
        { from: /^\/.*/, to: '/index.html' }
      ]
    }
  },
  preview: {
    port: 8083,
    // Enable history API fallback for SPA routes in preview mode
    historyApiFallback: true
  },
  plugins: [
    react(),
    nodePolyfills({
      protocolImports: true,
      globals: {
        Buffer: true,
        process: true,
        global: true
      },
      // Completely exclude all Ethereum-related modules
      exclude: [
        'crypto', 
        'crypto-browserify',
        'browserify-sign',
        'eth-block-tracker',
        'eth-json-rpc-filters',
        'eth-query',
        'ethjs-util',
        'ethereum'
      ]
    }),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      stream: 'stream-browserify',
      path: 'path-browserify',
      util: 'util',
      assert: 'assert',
      // Explicitly disable crypto-browserify and Ethereum modules
      crypto: '',
      'crypto-browserify': '',
      'browserify-sign': '',
      'eth-block-tracker': '',
      'eth-json-rpc-filters': '',
      'eth-query': '',
      'ethjs-util': '',
      buffer: 'buffer',
      // Solana module resolutions
      '@solana/spl_governance': path.resolve(__dirname, "node_modules/@solana/spl_governance"),
      '@solana/web3.js': path.resolve(__dirname, "node_modules/@solana/web3.js"),
      '@spl_governance': 'npm:@spl_governance@0.31.0',
      // Prevent any Ethereum-related modules from loading
      'window.ethereum': '',
      ethereum: '',
      // Add a mock for Web3 that returns null
      web3: path.resolve(__dirname, "./src/lib/mocks/web3-mock.js"),
    },
    // Prioritize resolving .ts and .tsx files
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  },
  optimizeDeps: {
    esbuildOptions: {
      // Define global vars to prevent errors
      define: {
        global: 'globalThis',
        'window.ethereum': 'undefined',
        'window.web3': 'undefined'
      },
      // NodeJS compatibility
      platform: 'browser',
      target: 'esnext',
      // Exclude Ethereum modules
      exclude: ['crypto-browserify', 'browserify-sign', 'eth-*', 'web3', 'ethereum'],
    }
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      // Externalize problematic modules
      external: ['crypto-browserify', 'browserify-sign', 'eth-*', 'web3', 'ethereum'],
    }
  }
}))
