import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import * as React from 'react'
import { MessageCircleHeart } from 'lucide-react'
import { Toaster } from 'sonner'
import formbricks from '@formbricks/js'

// Font preloads for FOIT/FOUT prevention
import plusJakartaWoff2 from '@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2?url'
import spaceGroteskWoff2 from '@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2?url'
import type { QueryClient } from '@tanstack/react-query'

import appCss from '~/styles/app.css?url'
import { ThemeProvider } from '~/components/theme/theme-provider'

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
        content: 'width=device-width, initial-scale=1.0, viewport-fit=cover',
      },
      {
        name: 'description',
        content:
          'Find your next role in AI safety. Build your profile, get matched to opportunities in research, policy, and operations.',
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
      // Open Graph
      {
        property: 'og:type',
        content: 'website',
      },
      {
        property: 'og:url',
        content: 'https://safetytalent.org',
      },
      {
        property: 'og:title',
        content: 'AI Safety Talent Network',
      },
      {
        property: 'og:description',
        content:
          'Find your next role in AI safety. Build your profile, get matched to opportunities in research, policy, and operations.',
      },
      {
        property: 'og:image',
        content: 'https://safetytalent.org/og-image.png',
      },
      {
        property: 'og:image:width',
        content: '1200',
      },
      {
        property: 'og:image:height',
        content: '630',
      },
      {
        property: 'og:site_name',
        content: 'AI Safety Talent Network',
      },
      // Twitter Card
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        name: 'twitter:title',
        content: 'AI Safety Talent Network',
      },
      {
        name: 'twitter:description',
        content:
          'Find your next role in AI safety. Build your profile, get matched to opportunities in research, policy, and operations.',
      },
      {
        name: 'twitter:image',
        content: 'https://safetytalent.org/og-image.png',
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

const FORMBRICKS_ENV_ID = import.meta.env.VITE_FORMBRICKS_ENV_ID
const FEEDBACK_FALLBACK_URL =
  'https://app.formbricks.com/s/cmli7c5fp97v9wv01rlya9has'

function RootComponent() {
  const formbricksReady = React.useRef(false)

  React.useEffect(() => {
    if (!FORMBRICKS_ENV_ID) return
    formbricks
      .setup({
        environmentId: FORMBRICKS_ENV_ID,
        appUrl: 'https://app.formbricks.com',
      })
      .then(() => {
        formbricksReady.current = true
      })
  }, [])

  return (
    <RootDocument formbricksReady={formbricksReady}>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({
  children,
  formbricksReady,
}: {
  children: React.ReactNode
  formbricksReady: React.RefObject<boolean>
}) {
  const handleFeedback = React.useCallback(() => {
    if (formbricksReady.current) {
      formbricks.track('feedback_clicked')
    } else {
      window.open(FEEDBACK_FALLBACK_URL, '_blank', 'noopener,noreferrer')
    }
  }, [formbricksReady])

  return (
    <html lang="en" className="light">
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider>
          {children}
          <Toaster position="top-right" richColors />
          <button
            type="button"
            onClick={handleFeedback}
            className="fixed bottom-5 right-5 z-50 flex size-12 items-center justify-center rounded-full bg-coral-500 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
            aria-label="Share feedback"
          >
            <MessageCircleHeart className="size-5" />
          </button>
        </ThemeProvider>
        {/* Leaflet JS for map component - loaded in body for global L */}
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" />
        <Scripts />
      </body>
    </html>
  )
}
