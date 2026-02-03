import { createRouter } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import { routerWithQueryClient } from '@tanstack/react-router-with-query'
import { ConvexQueryClient } from '@convex-dev/react-query'
import { ConvexAuthProvider } from '@convex-dev/auth/react'
import { routeTree } from './routeTree.gen'
import { isTauri } from '~/lib/platform'
import {
  exchangeOAuthCode,
  initDeepLinkAuth,
  setConvexClient,
} from '~/lib/tauri/auth'

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

  // Initialize deep link auth listener for Tauri mobile OAuth
  if (typeof window !== 'undefined' && isTauri()) {
    // Set the Convex client for OAuth code exchange
    setConvexClient(convexQueryClient.convexClient)

    // Initialize deep link auth listener
    // The callback now receives codeVerifier from PKCE store via handleDeepLinkUrl
    initDeepLinkAuth(async ({ code, state, provider, codeVerifier }) => {
      try {
        // Exchange the code for tokens via Convex action, passing codeVerifier for PKCE
        const result = await exchangeOAuthCode(
          code,
          state,
          provider,
          codeVerifier,
        )

        if (result.success) {
          // Navigate to profile or intended destination
          // Note: This exchanges the code for user info, but doesn't create
          // a Convex auth session. The checkpoint will test if this works
          // with @convex-dev/auth or if we need custom session handling.
          window.location.href = '/profile'
        } else {
          console.error('OAuth login failed:', result.error)
          window.location.href = '/login?error=oauth_failed'
        }
      } catch (error) {
        console.error('OAuth callback error:', error)
        window.location.href = '/login?error=oauth_failed'
      }
    })
  }

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
        <ConvexAuthProvider client={convexQueryClient.convexClient}>
          {children}
        </ConvexAuthProvider>
      ),
    }),
    queryClient,
  )

  return router
}
