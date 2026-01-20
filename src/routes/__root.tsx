import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import * as React from 'react'
import { Toaster } from 'sonner'

import type { QueryClient } from '@tanstack/react-query'

// Font preloads for FOIT/FOUT prevention
import plusJakartaWoff2 from '@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2?url'
import loraWoff2 from '@fontsource-variable/lora/files/lora-latin-wght-normal.woff2?url'

import appCss from '~/styles/app.css?url'
import { ThemeProvider } from '~/components/theme/theme-provider'

// FOIT prevention script - runs before CSS to set dark class immediately
const themeScript = `(function(){
  try {
    const theme = localStorage.getItem('astn-theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (theme === 'dark' || (theme === 'system' && systemDark) || (!theme && systemDark)) {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})()`

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'AI Safety Talent Network',
      },
    ],
    scripts: [
      // Theme script MUST run before CSS to prevent FOIT
      {
        children: themeScript,
      },
    ],
    links: [
      // Font preloads (MUST come before stylesheet for browser prioritization)
      {
        rel: 'preload',
        href: plusJakartaWoff2,
        as: 'font',
        type: 'font/woff2',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'preload',
        href: loraWoff2,
        as: 'font',
        type: 'font/woff2',
        crossOrigin: 'anonymous',
      },
      // Stylesheet (after preloads)
      { rel: 'stylesheet', href: appCss },
      // Leaflet CSS for map component
      {
        rel: 'stylesheet',
        href: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
      },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/apple-touch-icon.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/favicon-32x32.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: '/favicon-16x16.png',
      },
      { rel: 'manifest', href: '/site.webmanifest', color: '#fffff' },
      { rel: 'icon', href: '/favicon.ico' },
    ],
  }),
  notFoundComponent: () => <div>Route not found</div>,
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider defaultTheme="system" storageKey="astn-theme">
          {children}
          <Toaster position="top-right" richColors />
        </ThemeProvider>
        {/* Leaflet JS for map component - loaded in body for global L */}
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" />
        <Scripts />
      </body>
    </html>
  )
}
