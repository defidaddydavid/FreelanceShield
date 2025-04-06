import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    sourcemap: true,
  },
  server: {
    port: 5173,
    strictPort: true,
    open: false,
  },
  plugins: [
    react(),
    nodePolyfills({
      protocolImports: true,
      globals: {
        Buffer: true,
        process: true,
        global: true
      }
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      stream: 'stream-browserify',
      path: 'path-browserify', 
      util: 'util',
      assert: 'assert',
      buffer: 'buffer',
    }
  },
  define: {
    "process.env.MOCK_DATA": JSON.stringify("false"),
    "global": "globalThis",
  },
});
