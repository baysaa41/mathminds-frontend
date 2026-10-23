/* global process */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Bundle analyzer - only in analyze mode
    process.env.ANALYZE && visualizer({
      filename: './dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    })
  ].filter(Boolean),
  server: {
    host: '0.0.0.0',
    allowedHosts: ['mini', 'localhost', '192.168.1.74'],
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: ['mini', 'localhost', '192.168.1.74'],
  },
  build: {
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'bootstrap': ['bootstrap', 'react-bootstrap'],
          'math': ['better-react-mathjax'],
          'editor': ['@tiptap/react', '@tiptap/starter-kit'],
        }
      }
    },
    // Source maps for production debugging
    sourcemap: false,
    // Chunk size warning limit (default: 500kb)
    chunkSizeWarningLimit: 600,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: true,
  }
})
