import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import * as React from 'react'
import { Toaster } from 'sonner'

// Font preloads for FOIT/FOUT prevention
import plusJakartaWoff2 from '@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2?url'
import spaceGroteskWoff2 from '@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2?url'
import type { QueryClient } from '@tanstack/react-query'

import appCss from '~/styles/app.css?url'
import { ThemeProvider } from '~/components/theme/theme-provider'

// Server function to read theme from cookie for SSR
const getThemeFromCookie = createServerFn({ method: 'GET' }).handler(() => {
  const request = getRequest()
  const cookies = request.headers.get('cookie') || ''
  const match = cookies.match(/astn-theme=([^;]+)/)
  if (!match) return 'system'
  return match[1] as 'dark' | 'light' | 'system'
})

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
  initialTheme?: 'dark' | 'light' | 'system'
}>()({
  beforeLoad: async () => {
    const initialTheme = await getThemeFromCookie()
    return { initialTheme }
  },
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1.0, viewport-fit=cover',
      },
      {
        name: 'apple-mobile-web-app-capable',
        content: 'yes',
      },
      {
        name: 'mobile-web-app-capable',
        content: 'yes',
      },
      {
        name: 'apple-mobile-web-app-status-bar-style',
        content: 'default',
      },
      {
        title: 'AI Safety Talent Network',
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
        href: spaceGroteskWoff2,
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

// Minimal script only for "system" theme - detects system preference
const systemThemeScript = `(function(){
  try {
    var d=document.documentElement;
    if(!d.classList.contains('dark')&&!d.classList.contains('light')){
      d.classList.add(window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');
    }
  }catch(e){}
})()`

function RootDocument({ children }: { children: React.ReactNode }) {
  const { initialTheme } = Route.useRouteContext()

  // For explicit dark/light, apply class directly from SSR (no flash)
  // For system theme, we need the inline script to detect preference
  const themeClass =
    initialTheme === 'dark' ? 'dark' : initialTheme === 'light' ? 'light' : ''

  return (
    <html
      lang="en"
      className={themeClass || undefined}
      suppressHydrationWarning
    >
      <head suppressHydrationWarning>
        {/* Only inject script for system theme - dark/light are handled by SSR */}
        {initialTheme === 'system' && (
          <script
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: systemThemeScript }}
          />
        )}
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
