import * as Sentry from '@sentry/tanstackstart-react'
import { createRouter } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import { routerWithQueryClient } from '@tanstack/react-router-with-query'
import { ConvexQueryClient } from '@convex-dev/react-query'
import { ClerkProvider, useAuth } from '@clerk/clerk-react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { Suspense, use, useEffect, useRef } from 'react'
import { Authenticated, useMutation } from 'convex/react'
import { api } from '../convex/_generated/api'
import { routeTree } from './routeTree.gen'
import type { Clerk } from '@clerk/clerk-js'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { isTauri } from '~/lib/platform'
import { Spinner } from '~/components/ui/spinner'
import { ErrorDisplay } from '~/components/ErrorDisplay'

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

// Lazy singleton — only loaded in Tauri, tree-shaken from web builds
let clerkPromise: Promise<Clerk> | null = null
function getTauriClerk() {
  if (!clerkPromise) {
    clerkPromise = import('tauri-plugin-clerk').then((m) => m.initClerk())
  }
  return clerkPromise
}

function TauriClerkProvider({
  children,
  convexClient,
}: {
  children: React.ReactNode
  convexClient: any
}) {
  const clerk = use(getTauriClerk())
  return (
    <ClerkProvider publishableKey={clerk.publishableKey} Clerk={clerk}>
      <ConvexProviderWithClerk client={convexClient} useAuth={useAuth}>
        <Authenticated>
          <UserMigration />
        </Authenticated>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  )
}

function DefaultErrorComponent({ error, reset }: ErrorComponentProps) {
  return <ErrorDisplay error={error} reset={reset} />
}

function LoadingSpinner() {
  return (
    <main className="container mx-auto px-4 py-16">
      <div className="flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    </main>
  )
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
        if (isTauri()) {
          return (
            <Suspense fallback={<LoadingSpinner />}>
              <TauriClerkProvider convexClient={convexQueryClient.convexClient}>
                {children}
              </TauriClerkProvider>
            </Suspense>
          )
        }
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
    })
  }

  return router
}
