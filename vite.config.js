import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { dashboardHtmlFallback, defaultSurfaceRedirect } from './scripts/dashboard-routing.mjs'

export default defineConfig({
  plugins: [react(), tailwindcss(), {
    name: 'dashboard-entry-point',
    configureServer(server) {
      server.middlewares.use(defaultSurfaceRedirect)
      server.middlewares.use(dashboardHtmlFallback)
    },
    configurePreviewServer(server) {
      server.middlewares.use(defaultSurfaceRedirect)
      server.middlewares.use(dashboardHtmlFallback)
    },
  }],
  build: {
    rolldownOptions: {
      input: {
        console: fileURLToPath(new URL('./index.html', import.meta.url)),
        dashboard: fileURLToPath(new URL('./dashboard/index.html', import.meta.url)),
      },
    },
  },
  resolve: {
    alias: {
      // Keep Dashboard imports explicit and separate from Console.
      '@dashboard': fileURLToPath(new URL('./src/dashboard', import.meta.url)),
      // Map Next.js framework imports to react-router-based shims.
      'next/navigation': fileURLToPath(
        new URL('./src/dashboard/lib/next-shim/navigation.js', import.meta.url),
      ),
      'next/link': fileURLToPath(
        new URL('./src/dashboard/lib/next-shim/link.jsx', import.meta.url),
      ),
    },
  },
  server: {
    // Native file-system events don't fire reliably in this workspace, so
    // Vite never picked up edits (no HMR). Polling forces reliable detection.
    watch: {
      usePolling: true,
      interval: 150,
    },
  },
})
