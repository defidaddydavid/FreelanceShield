import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { Connection, clusterApiUrl } from '@solana/web3.js';

// Extend the Window interface to include the ethereum property
declare global {
  interface Window {
    ethereum?: any;
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  define: {
    'process.env.MOCK_DATA': JSON.stringify(mode === 'development' ? 'true' : 'false')
  },
  server: {
    host: "localhost", 
    port: 3000, 
    hmr: {
      timeout: 60000 
    },
    watch: {
      usePolling: true, 
      interval: 1000 
    },
    proxy: {
      "/api": {
        target: "http://localhost:8081",
        changeOrigin: true,
        secure: false,
        timeout: 60000, 
        rewrite: (path) => path.replace(/^\/api/, "")
      },
      "/regulatory-api": {
        target: "http://localhost:8083",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/regulatory-api/, "")
      }
    },
    historyApiFallback: {
      rewrites: [
        { from: /^\/regulatory-compliance.*/, to: '/index.html' },
        { from: /^\/.*/, to: '/index.html' }
      ]
    }
  },
  preview: {
    port: 4000, 
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
      exclude: []
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
      buffer: 'buffer',
      '@solana/spl_governance': path.resolve(__dirname, "node_modules/@solana/spl_governance"),
      '@solana/web3.js': path.resolve(__dirname, "node_modules/@solana/web3.js"),
      '@spl_governance': 'npm:@spl_governance@0.31.0',
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
      platform: 'browser',
      target: 'esnext',
    }
  },
  build: {
    sourcemap: true,
    rollupOptions: {
    }
  }
}))

const rpcEndpoints = [
  clusterApiUrl('devnet'),
  'https://your-backup-rpc-node.com',
];

let connectionEstablished = false;
let connection;

for (const endpoint of rpcEndpoints) {
  try {
    connection = new Connection(endpoint);
    await connection.getVersion(); 
    connectionEstablished = true;
    break;
  } catch (error) {
    console.warn(`Failed to connect to ${endpoint}`);
  }
}
