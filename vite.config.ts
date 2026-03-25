import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig, type Plugin } from 'vite'

const workspaceRoot = path.resolve(process.cwd())
const useSentryPlugin = Boolean(process.env.SENTRY_AUTH_TOKEN)
const sentryPlugins = useSentryPlugin
  ? await import('@sentry/sveltekit').then(({ sentrySvelteKit }) =>
      sentrySvelteKit({
        org: 'baish',
        project: 'javascript-sveltekit',
        authToken: process.env.SENTRY_AUTH_TOKEN,
        telemetry: false,
        sourcemaps: {
          filesToDeleteAfterUpload: ['**/*.map'],
        },
      }),
    )
  : []

const stripClerkUseClientDirective = (): Plugin => ({
  name: 'strip-clerk-use-client-directive',
  enforce: 'pre',
  transform(code, id) {
    if (!id.includes('@clerk/ui/dist/ClerkUI.js')) {
      return null
    }

    return {
      code: code.replace(/^['"]use client['"];?\s*/, ''),
      map: null,
    }
  },
})

export default defineConfig({
  envDir: workspaceRoot,
  server: {
    fs: {
      allow: [workspaceRoot],
    },
    proxy: {
      '/ingest': {
        target: 'https://us.i.posthog.com',
        changeOrigin: true,
        rewrite: (routePath: string) => routePath.replace(/^\/ingest/, ''),
        secure: false,
      },
      '/tunnel': {
        target: 'https://o4510997439053824.ingest.de.sentry.io',
        changeOrigin: true,
        rewrite: () =>
          '/api/4510997440692304/envelope/?sentry_key=f7612c740401feef0039be0728f64cc4',
        secure: false,
      },
    },
  },
  build: {
    sourcemap: 'hidden',
    chunkSizeWarningLimit: 3000,
  },
  resolve: {
    alias: {
      '~': path.resolve('./src'),
      $convex: path.resolve('./convex'),
    },
  },
  plugins: [
    stripClerkUseClientDirective(),
    tailwindcss(),
    sveltekit(),
    ...sentryPlugins,
  ],
})
