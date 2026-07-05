import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true, // For Capacitor dev on device
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // firebase (~585KB) and recharts (~549KB) are inherently large vendor libs.
    // They're already isolated into their own cacheable chunks below and only
    // loaded when a route that needs them is visited — splitting further
    // wouldn't reduce total bytes shipped, just how they're chunked. Raising
    // the warning threshold avoids noise for chunks that are already optimal.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('firebase')) return 'firebase';
          if (id.includes('recharts')) return 'charts';
          if (id.includes('framer-motion')) return 'motion';
        },
      },
    },
  },
  define: {
    global: 'globalThis',
  },
});
