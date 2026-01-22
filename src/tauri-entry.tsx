// tauri-entry.tsx
// Client-only entry point for Tauri SPA builds
// Note: Full route integration requires SPA-compatible routes (no server functions)
// This entry provides basic Convex connectivity for mobile builds
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConvexQueryClient } from '@convex-dev/react-query'
import { ConvexAuthProvider } from '@convex-dev/auth/react'

// Import styles (includes font imports)
import './styles/app.css'

// Placeholder app component - will be replaced with full router in Plan 25-04
function TauriApp() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-2xl font-display text-foreground">ASTN</h1>
        <p className="text-muted-foreground mt-2">
          AI Safety Talent Network
        </p>
        <p className="text-sm text-muted-foreground mt-4">
          Mobile app loading...
        </p>
      </div>
    </div>
  )
}

function App() {
  const CONVEX_URL = import.meta.env.VITE_CONVEX_URL

  if (!CONVEX_URL) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">Missing VITE_CONVEX_URL</p>
      </div>
    )
  }

  const convexQueryClient = new ConvexQueryClient(CONVEX_URL)
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
        gcTime: 5000,
      },
    },
  })
  convexQueryClient.connect(queryClient)

  return (
    <QueryClientProvider client={queryClient}>
      <ConvexAuthProvider client={convexQueryClient.convexClient}>
        <TauriApp />
      </ConvexAuthProvider>
    </QueryClientProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
