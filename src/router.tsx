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

function UserMigration() {
  const migrateUser = useMutation(api.userMigration.migrateUserIfNeeded)
  const didRun = useRef(false)

  useEffect(() => {
    if (didRun.current) return
    didRun.current = true
    migrateUser().catch(() => {
      // Silent failure — migration is best-effort
    })
  }, [migrateUser])

  return null
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
      defaultErrorComponent: (err) => <p>{err.error.stack}</p>,
      defaultNotFoundComponent: () => <p>not found</p>,
      Wrap: ({ children }) => (
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
      ),
    }),
    queryClient,
  )

  return router
}
