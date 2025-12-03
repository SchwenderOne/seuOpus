import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
    preserveSymlinks: true,
  },
  server: {
    port: 3000,
    open: true,
    fs: {
      allow: ['..'], // Allow serving files from parent directory (for symlinks)
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  // Serve static assets from the public folder
  publicDir: 'public',
});
