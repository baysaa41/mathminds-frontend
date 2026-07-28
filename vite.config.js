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
          // ЗОРИУДААР "excalidraw" нэртэй manualChunks entry ашиглахгүй: object хэлбэрийн
          // manualChunks-д нэр өгсөн chunk бүрийг Vite <link rel="modulepreload">-ээр
          // index.html-д эхнээс нь татуулдаг болж хувирдаг (зөвхөн DrawPage/DrawingPanel-ийн
          // lazy() дотор л хэрэглэгддэг ч гэсэн) — @excalidraw/excalidraw (~1.1MB)-ийг
          // Rollup-ийн автомат code-splitting-д даатгаснаар зөвхөн бодитоор зурах хуудас/
          // панел нээх үед л татагдана (chunk нэр автоматаар олгогдоно, гэхдээ preload-
          // гүй болно — bundle:analyze-аар шалгаж болно).
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
