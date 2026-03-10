import * as Sentry from '@sentry/tanstackstart-react'
import { createRouter } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import { routerWithQueryClient } from '@tanstack/react-router-with-query'
import { ConvexQueryClient } from '@convex-dev/react-query'
import { ClerkProvider, useAuth } from '@clerk/clerk-react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { useEffect, useRef } from 'react'
import { Authenticated, useMutation } from 'convex/react'
import { api } from '../convex/_generated/api'
import { routeTree } from './routeTree.gen'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { ErrorDisplay } from '~/components/ErrorDisplay'
import { initPushNotifications } from '~/lib/push-notifications'
import { initDeepLinks } from '~/lib/deep-links'

function UserMigration() {
  const migrateUser = useMutation(api.userMigration.migrateUserIfNeeded)
  const ensureIdentity = useMutation(api.profiles.ensureIdentityFields)
  const didRun = useRef(false)

  useEffect(() => {
    if (didRun.current) return
    didRun.current = true
    migrateUser().catch(() => {
      // Silent failure — migration is best-effort
    })
    ensureIdentity().catch(() => {
      // Silent failure — backfill is best-effort
    })
  }, [migrateUser, ensureIdentity])

  return null
}

function NativeSetup({
  convexClient,
}: {
  convexClient: ConvexQueryClient['convexClient']
}) {
  const didInit = useRef(false)

  useEffect(() => {
    if (didInit.current) return
    didInit.current = true
    void Promise.all([initPushNotifications(convexClient), initDeepLinks()])
  }, [convexClient])

  return null
}

function DefaultErrorComponent({ error, reset }: ErrorComponentProps) {
  return <ErrorDisplay error={error} reset={reset} />
}

export function getRouter() {
  const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL!
  if (!CONVEX_URL) {
    console.error('missing envar CONVEX_URL')
  }

  const convexQueryClient = new ConvexQueryClient(CONVEX_URL)

  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
        gcTime: 5000,
      },
    },
  })
  convexQueryClient.connect(queryClient)

  const router = routerWithQueryClient(
    createRouter({
      routeTree,
      defaultPreload: 'intent',
      context: { queryClient },
      scrollRestoration: true,
      defaultPreloadStaleTime: 0, // Let React Query handle all caching
      defaultViewTransition: true, // Enable View Transitions API for smooth page navigation
      defaultErrorComponent: DefaultErrorComponent,
      defaultNotFoundComponent: () => <p>not found</p>,
      Wrap: ({ children }) => {
        return (
          <ClerkProvider
            publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
          >
            <ConvexProviderWithClerk
              client={convexQueryClient.convexClient}
              useAuth={useAuth}
            >
              <Authenticated>
                <UserMigration />
                <NativeSetup convexClient={convexQueryClient.convexClient} />
              </Authenticated>
              {children}
            </ConvexProviderWithClerk>
          </ClerkProvider>
        )
      },
    }),
    queryClient,
  )

  if (!router.isServer) {
    Sentry.init({
      dsn: 'https://f7612c740401feef0039be0728f64cc4@o4510997439053824.ingest.de.sentry.io/4510997440692304',
      sendDefaultPii: true,
      tunnel: '/tunnel',
      integrations: [
        Sentry.tanstackRouterBrowserTracingIntegration(router),
        Sentry.replayIntegration(),
      ],
      tracesSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      enableLogs: true,
      ignoreErrors: [
        // Benign: browser aborts ViewTransition when a new navigation starts during an ongoing transition
        'Skipped ViewTransition due to another transition starting',
      ],
    })
  }

  return router
}
