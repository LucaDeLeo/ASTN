import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { sentryTanstackStart } from '@sentry/tanstackstart-react/vite'
import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'

export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      '/ingest': {
        target: 'https://us.i.posthog.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ingest/, ''),
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
  plugins: [
    tailwindcss(),
    tsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tanstackStart(),
    nitro({
      preset: 'vercel',
    }),
    sentryTanstackStart({
      org: 'baish',
      project: 'javascript-tanstackstart-react',
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
    viteReact({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
  ],
})
