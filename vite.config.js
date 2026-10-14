import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { existsSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { dashboardHtmlFallback, defaultSurfaceRedirect } from './scripts/dashboard-routing.mjs'

const path = (relative) => fileURLToPath(new URL(relative, import.meta.url))

// Serves `api/*.ts` (Vercel functions on deploy) from the dev server, so
// Flows' fetch('/api/...') calls work locally too.
function apiRoutes(server) {
  return async (req, res, next) => {
    const match = req.url?.match(/^\/api\/([\w-]+)(?:\?|$)/)
    if (!match) return next()
    const file = `/api/${match[1]}.ts`
    if (!existsSync(path(`.${file}`))) {
      res.statusCode = 404
      res.end()
      return
    }
    try {
      const handler = (await server.ssrLoadModule(file))[req.method]
      if (!handler) {
        res.statusCode = 405
        res.end()
        return
      }
      const chunks = []
      for await (const chunk of req) chunks.push(chunk)
      const request = new Request(new URL(req.url, 'http://localhost'), {
        method: req.method,
        headers: req.headers,
        body: chunks.length ? Buffer.concat(chunks) : undefined,
      })
      const response = await handler(request)
      res.statusCode = response.status
      response.headers.forEach((value, key) => res.setHeader(key, value))
      res.end(Buffer.from(await response.arrayBuffer()))
    } catch (error) {
      server.config.logger.error(String(error?.stack ?? error))
      res.statusCode = 500
      res.end()
    }
  }
}

export default defineConfig(({ mode }) => {
  // The api handlers read server-only keys (e.g. TYPESAFE_API_KEY) from
  // process.env, as they do on Vercel. Load .env files for them in dev.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))

  return {
    plugins: [react(), tailwindcss(), {
      name: 'dashboard-entry-point',
      configureServer(server) {
        server.middlewares.use(defaultSurfaceRedirect)
        server.middlewares.use(dashboardHtmlFallback)
        server.middlewares.use(apiRoutes(server))
      },
      configurePreviewServer(server) {
        server.middlewares.use(defaultSurfaceRedirect)
        server.middlewares.use(dashboardHtmlFallback)
      },
    }],
    build: {
      rolldownOptions: {
        input: {
          console: path('./index.html'),
          dashboard: path('./dashboard/index.html'),
          flows: path('./flows/index.html'),
        },
      },
    },
    define: {
      // Flows was written for Next.js, which inlines NEXT_PUBLIC_* variables.
      'process.env.NEXT_PUBLIC_VERCEL_ENV': JSON.stringify(process.env.VERCEL_ENV ?? ''),
    },
    resolve: {
      alias: {
        // Keep Dashboard imports explicit and separate from Console.
        '@dashboard': path('./src/dashboard'),
        // Flows (TypeScript, from the account creation prototype) imports `@/`.
        '@/': path('./src/flows/'),
        // Map Next.js framework imports to react-router-based shims.
        'next/navigation': path('./src/dashboard/lib/next-shim/navigation.js'),
        'next/link': path('./src/dashboard/lib/next-shim/link.jsx'),
        // Flows' Next.js imports, mapped to plain React.
        'next/image': path('./src/flows/lib/next-shim/image.tsx'),
        'next/dynamic': path('./src/flows/lib/next-shim/dynamic.tsx'),
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
  }
})
