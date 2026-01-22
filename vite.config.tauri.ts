// vite.config.tauri.ts
// Separate config for Tauri builds - produces static SPA (no SSR)
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [
    tailwindcss(),
    tsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    react({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
  ],
  build: {
    outDir: 'dist',
    // SPA: single index.html handles all routes
    rollupOptions: {
      input: 'index.html',
    },
  },
  // Required for Tauri to resolve paths correctly
  base: './',
  // Clear screen disabled for Tauri dev mode output
  clearScreen: false,
  server: {
    port: 3000,
    strictPort: true,
  },
})
